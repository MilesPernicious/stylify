import { defineConfig } from 'astro/config';
import stylify from '@stylify/astro';


// https://astro.build/config
export default defineConfig({
	integrations: [stylify({
		transformIncludeFilter: () => true
	})],
	server: {
		host: '0.0.0.0',
		port: 3000
	}
});
