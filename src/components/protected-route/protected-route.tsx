import { selectIsAuthChecked, selectUser } from '@slices/userSlice';
import { Preloader } from '@ui';
import { Navigate, useLocation } from 'react-router-dom';

import { useSelector } from '@services/store';

import type { ProtectedRouteProps } from './type';
import type { TLocationState } from '@utils-types';

const DEFAULT_REDIRECT_PATH = '/';
const LOGIN_PATH = '/login';

export const ProtectedRoute = ({
  onlyUnAuth = false,
  children,
}: ProtectedRouteProps): React.JSX.Element => {
  const location = useLocation();
  const isAuthChecked = useSelector(selectIsAuthChecked);
  const user = useSelector(selectUser);

  if (!isAuthChecked) {
    return <Preloader />;
  }

  if (onlyUnAuth && user) {
    const { from } = (location.state ?? {}) as TLocationState;
    return <Navigate to={from ?? DEFAULT_REDIRECT_PATH} replace />;
  }

  if (!onlyUnAuth && !user) {
    return <Navigate to={LOGIN_PATH} state={{ from: location }} replace />;
  }

  return children;
};
