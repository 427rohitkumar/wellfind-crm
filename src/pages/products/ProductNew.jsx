import { useState } from 'react'
import { ChevronDown, Check, AlertTriangle, Save, Image, Tag, Package, DollarSign, Hash, ToggleRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea, Select, Label, Field, Checkbox, InputGroup, InputGroupText } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Link, useNavigate } from 'react-router-dom'

export default function ProductNew() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    sku: '',
    quantity: 0,
    trackQuantity: true,
    status: 'active',
    category: '',
    tags: [],
    images: []
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked, options } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (type === 'select-multiple') {
      const selected = Array.from(options)
        .filter(opt => opt.selected)
        .map(opt => opt.value)
      setFormData(prev => ({ ...prev, [name]: selected }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Product title is required'
    if (!formData.price) newErrors.price = 'Price is required'
    if (formData.price && parseFloat(formData.price) < 0) newErrors.price = 'Price must be positive'
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      // In a real app, this would submit to an API
      console.log('Product created:', formData)
      navigate('/products')
    }
  }

  const handleCancel = () => {
    navigate('/products')
  }

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb__item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb__item"><Link to="/products">Products</Link></li>
              <li className="breadcrumb__item" aria-current="page">New product</li>
            </ol>
          </nav>
          <h1 className="page__title">New product</h1>
          <p className="page__description">
            Add a product to your catalog with pricing, inventory, and images.
          </p>
        </div>
      </header>

      <div className="page__body">
        <form className="order-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-8">
              <div className="flex flex-col gap-3">
                <Card>
                  <div className="card__header">
                    <span className="card__title">Product details</span>
                  </div>
                  <div className="card__body">
                    <Field
                      label="Title"
                      error={errors.name}
                      htmlFor="prodName"
                    >
                      <Input
                        id="prodName"
                        name="name"
                        type="text"
                        placeholder="e.g. Espresso Beans 2kg"
                        value={formData.name}
                        onChange={handleChange}
                        error={!!errors.name}
                      />
                    </Field>
                    <Field
                      label="Description"
                      error={errors.description}
                      htmlFor="prodDesc"
                    >
                      <Textarea
                        id="prodDesc"
                        name="description"
                        rows={4}
                        placeholder="Describe the product for your storefront."
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </Field>
                  </div>
                </Card>

                <Card>
                  <div className="card__header"><span className="card__title">Media</span></div>
                  <div className="card__body">
                    <Field
                      label="Images"
                      htmlFor="prodImages"
                    >
                      <Input
                        id="prodImages"
                        name="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                      />
                      <p className="field__description">
                        PNG or JPG, up to 5 MB each. The first image is the thumbnail.
                      </p>
                    </Field>
                  </div>
                </Card>

                <Card>
                  <div className="card__header"><span className="card__title">Pricing</span></div>
                  <div className="card__body">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 sm:col-span-6">
                        <Field
                          label="Price"
                          error={errors.price}
                          htmlFor="prodPrice"
                        >
                          <InputGroup>
                            <InputGroupText>$</InputGroupText>
                            <Input
                              id="prodPrice"
                              name="price"
                              type="number"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              value={formData.price}
                              onChange={handleChange}
                              error={!!errors.price}
                            />
                          </InputGroup>
                        </Field>
                      </div>
                      <div className="col-span-12 sm:col-span-6">
                        <Field
                          label="Compare-at price"
                          htmlFor="prodCompare"
                        >
                          <InputGroup>
                            <InputGroupText>$</InputGroupText>
                            <Input
                              id="prodCompare"
                              name="compareAtPrice"
                              type="number"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              value={formData.compareAtPrice}
                              onChange={handleChange}
                            />
                          </InputGroup>
                        </Field>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="card__header"><span className="card__title">Inventory</span></div>
                  <div className="card__body">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 sm:col-span-6">
                        <Field
                          label="SKU"
                          error={errors.sku}
                          htmlFor="prodSku"
                        >
                          <Input
                            id="prodSku"
                            name="sku"
                            type="text"
                            placeholder="ESP-2000"
                            value={formData.sku}
                            onChange={handleChange}
                            error={!!errors.sku}
                          />
                        </Field>
                      </div>
                      <div className="col-span-12 sm:col-span-6">
                        <Field
                          label="Quantity"
                          htmlFor="prodQty"
                        >
                          <Input
                            id="prodQty"
                            name="quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={handleChange}
                            min="0"
                          />
                        </Field>
                      </div>
                    </div>
                    <Field className="mt-2">
                      <div className="field__item">
                        <Checkbox
                          id="prodTrack"
                          name="trackQuantity"
                          checked={formData.trackQuantity}
                          onChange={handleChange}
                        />
                        <Label htmlFor="prodTrack">Track quantity</Label>
                      </div>
                    </Field>
                  </div>
                </Card>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4">
              <div className="flex flex-col gap-3">
                <Card>
                  <div className="card__header"><span className="card__title">Status</span></div>
                  <div className="card__body">
                    <Field label="Status" htmlFor="prodStatus">
                      <Select
                        id="prodStatus"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </Select>
                    </Field>
                  </div>
                </Card>

                <Card>
                  <div className="card__header">
                    <span className="card__title">Organization</span>
                  </div>
                  <div className="card__body">
                    <Field label="Category" htmlFor="prodCategory">
                      <Select
                        id="prodCategory"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        placeholder="Select category"
                      >
                        <option value=""></option>
                        <option value="coffee">Coffee</option>
                        <option value="equipment">Equipment</option>
                        <option value="supplies">Supplies</option>
                        <option value="gifts">Gifts</option>
                      </Select>
                    </Field>
                    <Field label="Tags" htmlFor="prodTags">
                      <Select
                        id="prodTags"
                        name="tags"
                        multiple
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="Add tags"
                      >
                        <option value="featured">Featured</option>
                        <option value="new">New</option>
                        <option value="sale">Sale</option>
                        <option value="seasonal">Seasonal</option>
                      </Select>
                    </Field>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <div className="sticky-bar">
            <div className="me-auto">
              <Badge variant="warning" soft>
                <AlertTriangle className="w-3 h-3 mr-1.5" aria-hidden="true" />
                Draft
              </Badge>
            </div>
            <Link to="/products" className="button button--ghost button--neutral">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Cancel
            </Link>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" aria-hidden="true" />
              Save product
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}