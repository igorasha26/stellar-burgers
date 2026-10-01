import {
  BurgerIcon,
  ListIcon,
  ProfileIcon,
  Logo,
} from '@krgaa/react-developer-burger-ui-components';
import { clsx } from 'clsx';
import { Link, NavLink, useLocation } from 'react-router-dom';

import type { TAppHeaderUIProps } from './type';

import styles from './app-header.module.css';

const INGREDIENTS_PATH = '/ingredients';

const getLinkClassName = ({ isActive }: { isActive: boolean }): string =>
  clsx(styles.link, isActive && styles.link_active);

export const AppHeaderUI = ({ userName }: TAppHeaderUIProps): React.JSX.Element => {
  const { pathname } = useLocation();
  const isConstructorActive = pathname === '/' || pathname.startsWith(INGREDIENTS_PATH);

  return (
    <header className={styles.header}>
      <nav className={`${styles.menu} p-4`}>
        <div className={styles.menu_part_left}>
          <NavLink
            to="/"
            className={() => getLinkClassName({ isActive: isConstructorActive })}
            end
          >
            <BurgerIcon type={isConstructorActive ? 'primary' : 'secondary'} />
            <p className="text text_type_main-default ml-2 mr-10">Конструктор</p>
          </NavLink>
          <NavLink to="/feed" className={getLinkClassName}>
            {({ isActive }) => (
              <>
                <ListIcon type={isActive ? 'primary' : 'secondary'} />
                <p className="text text_type_main-default ml-2">Лента заказов</p>
              </>
            )}
          </NavLink>
        </div>
        <Link to="/" className={styles.logo}>
          <Logo className="" />
        </Link>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            clsx(styles.link, styles.link_position_last, isActive && styles.link_active)
          }
        >
          {({ isActive }) => (
            <>
              <ProfileIcon type={isActive ? 'primary' : 'secondary'} />
              <p className="text text_type_main-default ml-2">
                {userName ?? 'Личный кабинет'}
              </p>
            </>
          )}
        </NavLink>
      </nav>
    </header>
  );
};
