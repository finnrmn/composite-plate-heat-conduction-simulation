import 'styled-components';
import { Theme } from './styles/theme';

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- styled-components theme augmentation
  export interface DefaultTheme extends Theme {}
}
