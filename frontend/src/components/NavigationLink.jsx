import { Link } from 'react-router-dom';

function NavigationLink({ to, back = false, children }) {
  return (
    <Link to={to} className="secondary-control">
      {back && <span aria-hidden="true" className="text-muted">←</span>}
      {children}
      {!back && <span aria-hidden="true" className="text-base leading-none text-muted">›</span>}
    </Link>
  );
}

export default NavigationLink;
