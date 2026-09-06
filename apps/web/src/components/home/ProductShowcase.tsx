import Image from "next/image";
import Link from "next/link";

/** Our existing in-house products; CMS remains the source for all client case studies. */
export function ProductShowcase() {
  return (
    <div className="product-showcase">
      <Link className="product-feature" href="/case-studies/#covyvo">
        <div className="product-feature-image">
          <Image
            src="/case-studies/covyvo-dashboard.webp"
            alt="Covyvo's business dashboard, with payroll, revenue and compliance tools"
            width={1440}
            height={960}
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
        <div className="product-feature-heading">
          <h3>Covyvo</h3>
          <span aria-hidden="true">↗</span>
        </div>
        <p>Payroll, e-invoicing and everyday business tools.</p>
        <span className="product-feature-meta">
          In-house product · Under active development
        </span>
      </Link>
      <Link className="product-feature" href="/case-studies/#gleen">
        <div className="product-feature-image product-feature-image-app">
          <Image
            src="/case-studies/gleen-app.webp"
            alt="GLEEN's study app with progress tracking, subjects and mock exams"
            width={960}
            height={1440}
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
        <div className="product-feature-heading">
          <h3>GLEEN</h3>
          <span aria-hidden="true">↗</span>
        </div>
        <p>Exam preparation that makes room for play.</p>
        <span className="product-feature-meta">
          In-house product · Under active development
        </span>
      </Link>
    </div>
  );
}
