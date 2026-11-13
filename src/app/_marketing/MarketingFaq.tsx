import Link from 'next/link';
import { MARKETING as UI } from '../../config/marketing';
import { MARKETING_FAQ } from '../../config/marketing-faq';
import { IceIcon } from '../_ui/IceIcon';
export function MarketingFaq() {
  return (
    <div className="marketing-faq-list">
      <Link className="marketing-text-link" href="/contact">
        {UI.CONTACT}
        <IceIcon name="arrow" />
      </Link>
      <div>
        {MARKETING_FAQ.map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <IceIcon name="next" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
