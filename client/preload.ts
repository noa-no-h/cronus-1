import { plugin } from 'bun';
import styleLoader from 'bun-style-loader';

await plugin(styleLoader());
