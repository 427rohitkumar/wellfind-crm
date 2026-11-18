import { MessageSquare, Edit2, Mail, Phone, MapPin, Calendar, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

const activities = [
  {
    id: 1,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" d="m2 3l.265.088c1.32.44 1.98.66 2.357 1.184S5 5.492 5 6.883V9.5c0 2.828 0 4.243.879 5.121c.878.879 2.293.879 5.121.879h8" />
          <path d="M7.5 18a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Zm9 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3ZM5 6h11.45c2.055 0 3.083 0 3.528.674c.444.675.04 1.619-.77 3.508l-.429 1c-.378.882-.567 1.322-.942 1.57c-.376.248-.856.248-1.815.248H5" />
        </g>
      </svg>
    ),
    title: 'Placed order',
    link: { label: '#10428', href: '/orders/10428' },
    time: '2 hours ago',
  },
  {
    id: 2,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeWidth={1.5} d="M9.153 5.408C10.42 3.136 11.053 2 12 2s1.58 1.136 2.847 3.408l.328.588c.36.646.54.969.82 1.182s.63.292 1.33.45l.636.144c2.46.557 3.689.835 3.982 1.776c.292.94-.546 1.921-2.223 3.882l-.434.507c-.476.557-.715.836-.822 1.18c-.107.345-.071.717.001 1.46l.066.677c.253 2.617.38 3.925-.386 4.506s-1.918.051-4.22-1.009l-.597-.274c-.654-.302-.981-.452-1.328-.452s-.674.15-1.328.452l-.596.274c-2.303 1.06-3.455 1.59-4.22 1.01c-.767-.582-.64-1.89-.387-4.507l.066-.676c.072-.744.108-1.116 0-1.46c-.106-.345-.345-.624-.821-1.18l-.434-.508c-1.677-1.96-2.515-2.941-2.223-3.882S3.58 8.328 6.04 7.772l.636-.144c.699-.158 1.048-.237 1.329-.45s.46-.536.82-1.182z" />
      </svg>
    ),
    title: 'Left a 5-star review on Espresso Beans 2kg',
    time: 'Yesterday',
  },
  {
    id: 3,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={1.5} d="m15.578 3.382l2 1.05c2.151 1.129 3.227 1.693 3.825 2.708C22 8.154 22 9.417 22 11.942v.117c0 2.524 0 3.787-.597 4.801c-.598 1.015-1.674 1.58-3.825 2.709l-2 1.049C13.822 21.539 12.944 22 12 22s-1.822-.46-3.578-1.382l-2-1.05c-2.151-1.129-3.227-1.693-3.825-2.708C2 15.846 2 14.583 2 12.06v-.117c0-2.525 0-3.788.597-4.802c.598-1.015 1.674-1.58 3.825-2.708l2-1.05C10.178 2.461 11.056 2 12 2s1.822.46 3.578 1.382ZM21 7.5l-4 2M12 12L3 7.5m9 4.5v9.5m0-9.5l4.5-2.25l.5-.25m0 0V13m0-3.5l-9.5-5" />
      </svg>
    ),
    title: 'Added 3 products to the catalog',
    time: 'Jun 14, 2026',
  },
  {
    id: 4,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="6" r="4" />
          <path d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z" />
        </g>
      </svg>
    ),
    title: 'Updated profile details',
    time: 'Jun 10, 2026',
    pending: true,
  },
]

const details = [
  { icon: Mail, label: 'Email', value: 'steven@meridian.com' },
  { icon: Phone, label: 'Phone', value: '+1 555 0123' },
  { icon: MapPin, label: 'Location', value: 'San Diego, US' },
  { icon: Calendar, label: 'Joined', value: 'Jan 2024' },
]

export default function Profile() {
  return (
    <div className="page__section">
      <div className="page__body">
        <section className="page__section">
          <Card className="relative">
            <img
              className="card__image aspect-[4/1] object-cover"
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&h=400&q=80"
              alt=""
              loading="lazy"
            />
            <div className="card__body">
              <div className="flex flex-wrap items-end gap-3 -mt-14">
                <Avatar
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2.5&w=192&h=192&q=80"
                  alt="Steven Gerrard"
                  name="Steven Gerrard"
                  size="2xl"
                  shape="circle"
                  className="relative"
                  style={{ '--avatar-size': '6rem', boxShadow: '0 0 0 4px var(--color-surface)' }}
                />
                <div className="flex-auto min-w-0">
                  <h1 className="text-xl font-bold">Steven Gerrard</h1>
                  <div className="text-muted-foreground">Store Owner · Meridian</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" color="neutral">
                    <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" />
                    Message
                  </Button>
                  <Button variant="neutral" as="a" href="/settings">
                    <Edit2 className="w-4 h-4 mr-2" aria-hidden="true" />
                    Edit profile
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="page__section">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-4">
              <div className="flex flex-col gap-3">
                <Card>
                  <div className="card__header"><span className="card__title">About</span></div>
                  <div className="card__body">
                    <p>
                      Coffee obsessive running Meridian since 2024 — sourcing single-origin
                      beans and the gear to brew them well.
                    </p>
                  </div>
                </Card>

                <Card>
                  <div className="card__header"><span className="card__title">Details</span></div>
                  <ul className="list-group">
                    {details.map((detail, index) => (
                      <li key={index} className="list-group__item flex items-center gap-3">
                        <detail.icon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                        <span className="font-medium">{detail.label}</span>
                        <span className="ms-auto text-muted-foreground">{detail.value}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <Card className="h-full">
                <div className="card__header">
                  <span className="card__title">Recent activity</span>
                </div>
                <div className="card__body">
                  <ol className="timeline">
                    {activities.map((activity) => (
                      <li key={activity.id} className={`timeline__item ${activity.pending ? 'timeline__item--pending' : ''}`}>
                        <span className="timeline__marker" aria-hidden="true">
                          {activity.icon}
                        </span>
                        <div className="timeline__body">
                          <div className="timeline__title">
                            {activity.title}
                            {activity.link && (
                              <a href={activity.link.href} className="link ms-2">
                                {activity.link.label}
                              </a>
                            )}
                          </div>
                          <div className="timeline__time">{activity.time}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}