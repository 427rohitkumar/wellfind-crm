import { useState } from 'react'
import { createPaymentOrder, loadRazorpayCheckout, verifyPayment } from '@/services/teacherPortalService'

/**
 * Opens Razorpay Checkout for the registration fee (first payment or yearly renewal) and confirms the
 * result with the server. The server and the webhook settle the status, so nothing is marked paid here.
 */
export function useRegistrationCheckout({ onSuccess, onError, onDone }) {
  const [paying, setPaying] = useState(false)

  const pay = async () => {
    setPaying(true)
    try {
      const [Razorpay, order] = await Promise.all([loadRazorpayCheckout(), createPaymentOrder()])
      await new Promise((resolve) => {
        const rzp = new Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amountPaise,
          currency: order.currency,
          name: order.name,
          description: order.description,
          prefill: order.prefill,
          theme: { color: '#35D0BA' },
          modal: { ondismiss: () => resolve() },
          handler: async (result) => {
            try {
              const res = await verifyPayment(result)
              if (res?.settled) onSuccess('Payment successful. Thank you!')
              else onError('We have not received the confirmation yet. If money was deducted, this page will update automatically.')
            } catch (err) {
              onError(err.message || 'We could not confirm the payment yet. If money was deducted, it will update automatically.')
            } finally {
              resolve()
            }
          },
        })
        rzp.on('payment.failed', (resp) => onError(resp?.error?.description || 'The payment failed. You can try again.'))
        rzp.open()
      })
    } catch (err) {
      onError(err.message || 'Could not start the payment.')
    } finally {
      setPaying(false)
      onDone?.()
    }
  }

  return { paying, pay }
}
