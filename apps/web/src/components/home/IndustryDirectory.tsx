import Link from "next/link";
import { Store, HeartHandshake, Container, Landmark } from "lucide-react";
import { industryGroups } from "../../content/catalogue.js";
const presentations = [
  {
    icon: Store,
    description:
      "Better experiences for the people who buy, book and do business with you.",
  },
  {
    icon: HeartHandshake,
    description:
      "Thoughtful systems for care, learning and the services people rely on.",
  },
  {
    icon: Container,
    description:
      "Connect the people, resources and information that keep your business moving.",
  },
  {
    icon: Landmark,
    description:
      "Make essential services easier to access, manage and deliver.",
  },
];
export function IndustryDirectory() {
  return (
    <div className="sector-cards">
      {industryGroups.map((group, index) => {
        const { icon: Icon, description } = presentations[index]!;
        return (
          <article
            className={`sector-card sector-tone-${index}`}
            key={group.heading}
          >
            <Icon
              className="sector-group-icon"
              size={30}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <h3>{group.heading}</h3>
            <p>{description}</p>
            <details className="sector-expand">
              <summary>
                Explore sectors <span aria-hidden="true">+</span>
              </summary>
              <div className="sector-destinations">
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
            </details>
          </article>
        );
      })}
      <p className="sector-invitation">
        Every industry is welcome.{" "}
        <Link href="/contact/">
          Tell us about yours <span aria-hidden="true">→</span>
        </Link>
      </p>
    </div>
  );
}
