import { useParams, Link } from 'react-router-dom'
import {
  Card, CardHeader, CardBody, CardFooter,
  Button,
  Badge,
  Avatar,
  Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell,
} from '../../components/ui'
import {
  ChevronLeft, Package, User, Mail, MapPin, CreditCard, Truck, Clock, CheckCircle, XCircle, AlertCircle,
  MoreHorizontal, Printer, Download, Edit
} from 'lucide-react'

const statusConfig = {
  delivered: { label: 'Delivered', variant: 'success', icon: CheckCircle },
  shipped: { label: 'Shipped', variant: 'info', icon: Truck },
  processing: { label: 'Processing', variant: 'warning', icon: Clock },
  pending: { label: 'Pending', variant: 'neutral', icon: AlertCircle },
  cancelled: { label: 'Cancelled', variant: 'danger', icon: XCircle },
}

const paymentConfig = {
  paid: { label: 'Paid', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  refunded: { label: 'Refunded', variant: 'neutral' },
  failed: { label: 'Failed', variant: 'danger' },
}

// Mock order data
const orderData = {
  'ORD-001': {
    id: 'ORD-001',
    customer: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    date: '2024-01-15',
    status: 'delivered',
    payment: 'paid',
    items: [
      { name: 'iPhone 15 Pro', sku: 'IPH-15P-256', price: 999.99, quantity: 1, total: 999.99 },
      { name: 'AirPods Pro (2nd Gen)', sku: 'APP-2G', price: 249.99, quantity: 1, total: 249.99 },
      { name: 'MagSafe Charger', sku: 'MSC-1', price: 39.99, quantity: 1, total: 39.99 },
    ],
    subtotal: 1289.97,
    shipping: 9.99,
    tax: 103.20,
    total: 1403.16,
    shippingAddress: {
      name: 'Sarah Johnson',
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'USA',
    },
    billingAddress: {
      name: 'Sarah Johnson',
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'USA',
    },
    paymentMethod: 'Visa ending in 4242',
    trackingNumber: '1Z999AA10123456784',
    notes: 'Customer requested signature confirmation.',
    timeline: [
      { date: '2024-01-15', time: '14:32', status: 'delivered', description: 'Package delivered to customer' },
      { date: '2024-01-14', time: '09:15', status: 'shipped', description: 'Package shipped via UPS Ground' },
      { date: '2024-01-13', time: '16:45', status: 'processing', description: 'Order processing started' },
      { date: '2024-01-13', time: '10:00', status: 'pending', description: 'Order placed' },
    ],
  },
}

export default function OrderDetail() {
  const { id } = useParams()
  const order = orderData[id] || orderData['ORD-001']
  const status = statusConfig[order.status]
  const payment = paymentConfig[order.payment]
  const StatusIcon = status.icon

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <Link to="/orders" className="button button--ghost button--icon button--sm mb-2" aria-label="Back to orders">
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <h1 className="page__title">Order {order.id}</h1>
          <p className="page__description">View order details and manage fulfillment.</p>
        </div>
        <div className="page__action flex-wrap gap-2">
          <Button variant="ghost" size="sm">
            <Printer className="w-4 h-4 mr-2" aria-hidden="true" />
            Print
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
            Edit
          </Button>
          <div className="relative" style={{ zIndex: 10 }}>
            <Button variant="ghost" size="sm" className="dropdown-trigger">
              <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
            </Button>
            <div className="dropdown-menu hidden absolute right-0 top-full mt-1 min-w-[160px] bg-surface border border-border rounded-lg shadow-lg py-1 z-50">
              <button className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2">
                <span>Duplicate Order</span>
              </button>
              <button className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-danger">
                <XCircle className="w-4 h-4" aria-hidden="true" />
                <span>Cancel Order</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="page__body">
        {/* Status Bar */}
        <Card variant="bordered" className="mb-6">
          <CardBody className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Badge variant={status.variant} size="lg" dot>
                  <StatusIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                  {status.label}
                </Badge>
                <Badge variant={payment.variant} size="lg">
                  {payment.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span><Package className="w-4 h-4 mr-1 inline" aria-hidden="true" /> {order.items.length} items</span>
                <span><CreditCard className="w-4 h-4 mr-1 inline" aria-hidden="true" /> {order.paymentMethod}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items & Totals */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="hover">
              <CardHeader>
                <h3 className="card__title">Order Items</h3>
              </CardHeader>
              <CardBody className="p-0">
                <Table hover alignMiddle>
                  <TableHead variant="alt">
                    <TableRow>
                      <TableHeaderCell scope="col">Product</TableHeaderCell>
                      <TableHeaderCell scope="col" align="center">SKU</TableHeaderCell>
                      <TableHeaderCell scope="col" align="end">Price</TableHeaderCell>
                      <TableHeaderCell scope="col" align="center">Qty</TableHeaderCell>
                      <TableHeaderCell scope="col" align="end">Total</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell align="center" className="text-sm text-muted-foreground font-mono">{item.sku}</TableCell>
                        <TableCell align="end" className="text-sm">${item.price.toFixed(2)}</TableCell>
                        <TableCell align="center" className="text-sm">{item.quantity}</TableCell>
                        <TableCell align="end" className="font-medium">${item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>

            <Card variant="hover">
              <CardHeader>
                <h3 className="card__title">Order Totals</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({order.items.length} items)</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>${order.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card variant="hover">
              <CardHeader>
                <h3 className="card__title">Timeline</h3>
              </CardHeader>
              <CardBody className="p-0">
                <div className="timeline">
                  {order.timeline.map((event, index) => {
                    const eventStatus = statusConfig[event.status]
                    const EventIcon = eventStatus.icon
                    return (
                      <div key={index} className="timeline-item flex gap-4 pb-6 last:pb-0 relative">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium relative z-10"
                          style={{ backgroundColor: `var(--color-${eventStatus.variant})`, color: 'white' }}>
                          <EventIcon className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{event.description}</span>
                            <span className="text-sm text-muted-foreground">{event.date} at {event.time}</span>
                          </div>
                        </div>
                        {index < order.timeline.length - 1 && (
                          <div className="absolute left-3 top-8 bottom-0 w-0.5" style={{ backgroundColor: 'var(--color-border)' }} aria-hidden="true" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Customer & Addresses */}
          <div className="space-y-6">
            <Card variant="hover">
              <CardHeader>
                <h3 className="card__title">Customer</h3>
              </CardHeader>
              <CardBody>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar src={order.avatar} name={order.customer} size="lg" />
                  <div>
                    <h4 className="font-medium">{order.customer}</h4>
                    <p className="text-sm text-muted-foreground">{order.email}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Order Date: </span>{new Date(order.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><span className="text-muted-foreground">Payment: </span>{order.paymentMethod}</p>
                  {order.trackingNumber && (
                    <p><span className="text-muted-foreground">Tracking: </span><code className="font-mono">{order.trackingNumber}</code></p>
                  )}
                </div>
                {order.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm"><span className="font-medium">Notes: </span>{order.notes}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card variant="hover">
              <CardHeader>
                <h3 className="card__title">Shipping Address</h3>
              </CardHeader>
              <CardBody>
                <address className="not-italic space-y-1">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                  <p>{order.shippingAddress.country}</p>
                </address>
              </CardBody>
            </Card>

            <Card variant="hover">
              <CardHeader>
                <h3 className="card__title">Billing Address</h3>
              </CardHeader>
              <CardBody>
                <address className="not-italic space-y-1">
                  <p className="font-medium">{order.billingAddress.name}</p>
                  <p>{order.billingAddress.street}</p>
                  <p>{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zip}</p>
                  <p>{order.billingAddress.country}</p>
                </address>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}