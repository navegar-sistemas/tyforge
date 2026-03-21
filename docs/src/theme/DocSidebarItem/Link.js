import React from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';

export default function DocSidebarItemLink({ item, ...props }) {
  // Remove props que não devem ir para o DOM
  const { activePath, onItemClick, ...rest } = props;
  const location = useLocation();
  const isActive =
    (item.to && location.pathname === item.to) ||
    (item.href && location.pathname === item.href);

  return (
    <li className="menu__list-item">
      <Link
        className={`menu__link${isActive ? ' menu__link--active' : ''}`}
        to={item.href || item.to}
        {...rest}
      >
        {item.label}
      </Link>
    </li>
  );
}
