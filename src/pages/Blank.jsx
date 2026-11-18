import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function Blank() {
  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb__item"><a href="/">Dashboard</a></li>
              <li className="breadcrumb__item" aria-current="page">Blank</li>
            </ol>
          </nav>
          <h1 className="page__title">Blank page</h1>
          <p className="page__description">
            A clean starting point — duplicate this file and build your view.
          </p>
        </div>
        <div className="page__action">
          <Button>
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            New
          </Button>
        </div>
      </header>

      <div className="page__body">
        <section className="page__section">
          <Card>
            <div className="empty-state">
              <span className="empty-state__media">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <g fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path
                      d="M5 8c0-2.828 0-4.243.879-5.121C6.757 2 8.172 2 11 2h2c2.828 0 4.243 0 5.121.879C19 3.757 19 5.172 19 8v8c0 2.828 0 4.243-.879 5.121C17.243 22 15.828 22 13 22h-2c-2.828 0-4.243 0-5.121-.879C5 20.243 5 18.828 5 16zm0-3.924c-.975.096-1.631.313-2.121.803C2 5.757 2 7.172 2 10v4c0 2.828 0 4.243.879 5.121c.49.49 1.146.707 2.121.803M19 4.076c.975.096 1.631.313 2.121.803C22 5.757 22 7.172 22 10v4c0 2.828 0 4.243-.879 5.121c-.49.49-1.146.707-2.121.803"
                    />
                    <path strokeLinecap="round" d="M9 13h6M9 9h6m-6 8h3" />
                  </g>
                </svg>
              </span>
              <h3 className="empty-state__title">Your content here</h3>
              <p className="empty-state__text">Replace this card with your page content.</p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}