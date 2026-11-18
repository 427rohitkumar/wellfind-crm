import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card, CardHeader, CardBody, CardFooter,
  Button,
  Input, Label, Field, Select,
  Badge,
  Avatar,
  Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell,
} from '../../components/ui'
import {
  ChevronLeft, Package, User, Mail, MapPin, CreditCard, Plus, Minus, Trash2, Search,
  Save, X
} from 'lucide-react'

const products = [
  { id: 1, name: 'iPhone 15 Pro', sku: 'IPH-15P-256', price: 999.99, stock: 45 },
  { id: 2, name: 'iPhone 15', sku: 'IPH-15-128', price: 799.99, stock: 62 },
  { id: 3, name: 'MacBook Air M2', sku: 'MBA-M2-256', price: 1199.99, stock: 28 },
  { id: 4, name: 'MacBook Pro 14"', sku: 'MBP-14-M3', price: 1999.99, stock: 15 },
  { id: 5, name: 'iPad Pro 12.9"', sku: 'IPP-129-M2', price: 1099.99, stock: 33 },
  { id: 6, name: 'iPad Air', sku: 'IPA-5-64', price: 599.99, stock: 41 },
  { id: 7, name: 'Apple Watch Series 9', sku: 'AWS-9-45', price: 399.99, stock: 56 },
  { id: 8, name: 'AirPods Pro (2nd Gen)', sku: 'APP-2G', price: 249.99, stock: 78 },
  { id: 9, name: 'AirPods (3rd Gen)', sku: 'AP-3G', price: 169.99, stock: 92 },
  { id: 10, name: 'MagSafe Charger', sku: 'MSC-1', price: 39.99, stock: 120 },
]

const customers = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah.j@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
  { id: 2, name: 'Michael Chen', email: 'm.chen@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael' },
  { id: 3, name: 'Emily Davis', email: 'emily.d@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily' },
  { id: 4, name: 'James Wilson', email: 'j.wilson@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james' },
  { id: 5, name: 'Lisa Anderson', email: 'l.anderson@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa' },
]

export default function OrderNew() {
  const [customer, setCustomer] = useState(null)
  const [items, setItems] = useState([{ productId: '', quantity: 1, price: 0 }])
  const [shippingAddress, setShippingAddress] = useState({
    name: '', street: '', city: '', state: '', zip: '', country: 'USA'
  })
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)
  const [billingAddress, setBillingAddress] = useState({
    name: '', street: '', city: '', state: '', zip: '', country: 'USA'
  })
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [editingItemIndex, setEditingItemIndex] = useState(null)

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, price: 0 }])
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const getProduct = (productId) => products.find(p => p.id === parseInt(productId))

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const product = getProduct(item.productId)
      return sum + (product ? product.price * item.quantity : 0)
    }, 0)
    const shipping = subtotal > 100 ? 0 : 9.99
    const tax = subtotal * 0.08
    const total = subtotal + shipping + tax
    return { subtotal, shipping, tax, total }
  }

  const { subtotal, shipping, tax, total } = calculateTotals()

  const handleSubmit = (e) => {
    e.preventDefault()
    // Submit order logic here
    console.log('Order submitted:', { customer, items, shippingAddress, billingAddress, paymentMethod, notes })
    alert('Order created successfully!')
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <Link to="/orders" className="button button--ghost button--icon button--sm mb-2" aria-label="Back to orders">
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <h1 className="page__title">New Order</h1>
          <p className="page__description">Create a new customer order.</p>
        </div>
        <div className="page__action flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={() => window.history.back()}>
            <X className="w-4 h-4 mr-2" aria-hidden="true" />
            Cancel
          </Button>
          <Button type="submit" form="order-form" variant="primary">
            <Save className="w-4 h-4 mr-2" aria-hidden="true" />
            Create Order
          </Button>
        </div>
      </header>
      
      <form id="order-form" onSubmit={handleSubmit} className="page__body">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer & Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="hover">
              <CardHeader>
                <h3 className="card__title">Customer</h3>
              </CardHeader>
              <CardBody>
                <Field label="Customer" required>
                  <div className="relative">
                    <input
                      type="text"
                      className="field__input"
                      placeholder="Search or select customer..."
                      value={customer ? `${customer.name} (${customer.email})` : ''}
                      readOnly
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowProductModal(true)}
                    >
                      <Search className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  {customer && (
                    <div className="mt-2 flex items-center gap-3 p-2 bg-muted rounded-lg">
                      <Avatar src={customer.avatar} name={customer.name} size="sm" />
                      <div className="flex-1">
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                      <button
                        type="button"
                        className="button button--ghost button--icon button--sm text-danger"
                        onClick={() => setCustomer(null)}
                        aria-label="Remove customer"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </Field>
              </CardBody>
            </Card>

            <Card variant="hover">
              <CardHeader variant="flex">
                <h3 className="card__title">Order Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
                  Add Item
                </Button>
              </CardHeader>
              <CardBody className="p-0">
                <Table hover alignMiddle>
                  <TableHead variant="alt">
                    <TableRow>
                      <TableHeaderCell scope="col">Product</TableHeaderCell>
                      <TableHeaderCell scope="col" align="center">Price</TableHeaderCell>
                      <TableHeaderCell scope="col" align="center">Qty</TableHeaderCell>
                      <TableHeaderCell scope="col" align="end">Total</TableHeaderCell>
                      <TableHeaderCell scope="col" align="center">
                        <span className="sr-only">Actions</span>
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => {
                      const product = getProduct(item.productId)
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {editingItemIndex === index ? (
                              <div className="relative">
                                <input
                                  type="text"
                                  className="field__input"
                                  placeholder="Search products..."
                                  value={productSearch}
                                  onChange={(e) => setProductSearch(e.target.value)}
                                  autoFocus
                                />
                                <div className="absolute z-10 w-full mt-1 max-h-48 overflow-auto bg-surface border border-border rounded-lg shadow-lg">
                                  {filteredProducts.map(p => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                                      onClick={() => {
                                        updateItem(index, 'productId', p.id)
                                        updateItem(index, 'price', p.price)
                                        setProductSearch('')
                                        setEditingItemIndex(null)
                                      }}
                                    >
                                      <span className="font-medium">{p.name}</span>
                                      <span className="text-sm text-muted-foreground ml-auto">{p.sku}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : product ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{product.name}</span>
                                <Badge variant="neutral" className="text-xs">{product.sku}</Badge>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="button button--ghost button--sm w-full justify-start"
                                onClick={() => setEditingItemIndex(index)}
                              >
                                <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
                                Add Product
                              </button>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {product ? (
                              <input
                                type="number"
                                className="field__input field__input--select w-24 text-center"
                                value={product.price.toFixed(2)}
                                readOnly
                              />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {product ? (
                              <input
                                type="number"
                                min="1"
                                max={product.stock}
                                className="field__input field__input--select w-20 text-center"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell align="end" className="font-medium">
                            {product ? `$${(product.price * item.quantity).toFixed(2)}` : '—'}
                          </TableCell>
                          <TableCell align="center">
                            <button
                              type="button"
                              className="button button--ghost button--icon button--sm text-danger"
                              onClick={() => removeItem(index)}
                              aria-label="Remove item"
                              disabled={items.length === 1}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>

            <Card variant="hover">
              <CardHeader>
                <h3 className="card__title">Notes</h3>
              </CardHeader>
              <CardBody>
                <Field>
                  <textarea
                    className="field__input field__input--textarea"
                    rows={3}
                    placeholder="Internal notes (not visible to customer)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>
              </CardBody>
            </Card>
          </div>

          {/* Summary & Addresses */}
          <div className="space-y-6">
            <Card variant="hover">
              <CardHeader>
                <h3 className="card__title">Order Summary</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({items.filter(i => i.productId).length} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card variant="hover">
              <CardHeader>
                <h3 className="card__title">Shipping Address</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <Field label="Full Name" required>
                    <input
                      type="text"
                      className="field__input"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                    />
                  </Field>
                  <Field label="Street Address" required>
                    <input
                      type="text"
                      className="field__input"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="City" required>
                      <input
                        type="text"
                        className="field__input"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      />
                    </Field>
                    <Field label="State" required>
                      <input
                        type="text"
                        className="field__input"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="ZIP Code" required>
                      <input
                        type="text"
                        className="field__input"
                        value={shippingAddress.zip}
                        onChange={(e) => setShippingAddress({...shippingAddress, zip: e.target.value})}
                      />
                    </Field>
                    <Field label="Country" required>
                      <Select
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      >
                        <option value="USA">United States</option>
                        <option value="CAN">Canada</option>
                        <option value="GBR">United Kingdom</option>
                        <option value="AUS">Australia</option>
                      </Select>
                    </Field>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card variant="hover">
              <CardHeader variant="flex">
                <h3 className="card__title">Billing Address</h3>
                <label className="toggle-wrapper">
                  <input
                    type="checkbox"
                    className="toggle__input"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  />
                  <span className="toggle__track"><span className="toggle__thumb" aria-hidden="true" /></span>
                  <span className="toggle__text">Same as shipping</span>
                </label>
              </CardHeader>
              <CardBody>
                {!billingSameAsShipping && (
                  <div className="space-y-4">
                    <Field label="Full Name" required>
                      <input
                        type="text"
                        className="field__input"
                        value={billingAddress.name}
                        onChange={(e) => setBillingAddress({...billingAddress, name: e.target.value})}
                      />
                    </Field>
                    <Field label="Street Address" required>
                      <input
                        type="text"
                        className="field__input"
                        value={billingAddress.street}
                        onChange={(e) => setBillingAddress({...billingAddress, street: e.target.value})}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="City" required>
                        <input
                          type="text"
                          className="field__input"
                          value={billingAddress.city}
                          onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                        />
                      </Field>
                      <Field label="State" required>
                        <input
                          type="text"
                          className="field__input"
                          value={billingAddress.state}
                          onChange={(e) => setBillingAddress({...billingAddress, state: e.target.value})}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="ZIP Code" required>
                        <input
                          type="text"
                          className="field__input"
                          value={billingAddress.zip}
                          onChange={(e) => setBillingAddress({...billingAddress, zip: e.target.value})}
                        />
                      </Field>
                      <Field label="Country" required>
                        <Select
                          value={billingAddress.country}
                          onChange={(e) => setBillingAddress({...billingAddress, country: e.target.value})}
                        >
                          <option value="USA">United States</option>
                          <option value="CAN">Canada</option>
                          <option value="GBR">United Kingdom</option>
                          <option value="AUS">Australia</option>
                        </Select>
                      </Field>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card variant="hover">
              <CardHeader>
                <h3 className="card__title">Payment Method</h3>
              </CardHeader>
              <CardBody>
                <Field label="Payment Method" required>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="">Select payment method</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash_on_delivery">Cash on Delivery</option>
                  </Select>
                </Field>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Customer Search Modal */}
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50" onClick={() => setShowProductModal(false)}>
            <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Customer</h3>
                <button className="button button--ghost button--icon button--sm" onClick={() => setShowProductModal(false)}>
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="p-4 border-b border-border">
                <InputGroup variant="search">
                  <InputGroupText aria-hidden="true"><Search className="w-4 h-4" /></InputGroupText>
                  <input
                    type="search"
                    className="field__input"
                    placeholder="Search customers..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </InputGroup>
              </div>
              <div className="overflow-auto">
                <ul className="divide-y divide-border">
                  {customers.map(c => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full p-4 hover:bg-muted flex items-center gap-4"
                        onClick={() => { setCustomer(c); setShowProductModal(false); }}
                      >
                        <Avatar src={c.avatar} name={c.name} size="md" />
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-sm text-muted-foreground">{c.email}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}