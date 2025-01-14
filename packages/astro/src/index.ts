import type { AstroIntegration } from 'astro';
import { UnpluginConfigInterface, stylifyVite, defineConfig as stylifyUnpluginConfig } from '@stylify/unplugin';
import { Configurator } from '@stylify/stylify';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { default as normalize } from 'normalize-path';
import type { BundleConfigInterface } from '@stylify/bundler';

export interface ConfigInterface extends UnpluginConfigInterface {
	importDefaultBundle?: false|boolean
}

export const defineConfig = stylifyUnpluginConfig;

export const stylify = (options: ConfigInterface = {}): AstroIntegration => {

	return {
		name: '@stylify/astro',
		hooks: {
			'astro:config:setup': ({ updateConfig, config, injectScript, command}): void => {
				const srcDir: string = normalize(join(fileURLToPath(config.root), 'src'));
				const singleBundleOutputFilePath: string = normalize(join(srcDir, 'styles', 'stylify.css'));
				const isDev = options.dev ?? (import.meta?.env?.DEV === true
					|| import.meta?.env?.MODE === 'development'
					|| command === 'dev'
					|| null);

				const generateDefaultBundle = typeof options.bundles === 'undefined';

				const configureBundles = <T extends BundleConfigInterface>(bundlesConfigs: T[]): T[] => {
					return bundlesConfigs.map((bundleConfig: T) => {
						bundleConfig.rewriteSelectorsInFiles = false;
						return bundleConfig;
					});
				};

				const defaultConfig: UnpluginConfigInterface = {
					dev: options.dev ?? isDev,
					bundler: {
						autoprefixerEnabled: false
					},
					compiler: {
						mangleSelectors: options.compiler?.mangleSelectors ?? !isDev,
						selectorsAreas: [
							'(?:^|\\s+)class=\\{((?:.|\\n)+)\\}',
							'(?:^|\\s+)class:list=\\{\\[((?:.|\\n)+)\\]\\}',
							`addAttribute\\(([\\s\\S]+), (?:"|\\')class:list(?:"|\\')\\)`,
							`addAttribute\\(([\\s\\S]+), (?:"|')class(?:"|')\\)`
						]
					},
					bundles: generateDefaultBundle
						? [{
							outputFile: singleBundleOutputFilePath,
							rewriteSelectorsInFiles: false,
							files: [`${srcDir}/**/*.{astro,html,js,json,jsx,mjs,md,mdx,svelte,ts,tsx,vue,yaml}`]
						}]
						: []
				};

				const configs = Configurator.getDefaultExistingConfigFiles(fileURLToPath(config.root));
				const configsValues = Object.values(configs);

				if (configsValues.length > 0) {
					defaultConfig.configFile = configsValues;
				}

				if (!generateDefaultBundle) {
					options.bundles = configureBundles(options.bundles);
				}

				if (typeof options.bundler?.bundles !== 'undefined') {
					options.bundler.bundles = configureBundles(options.bundler.bundles);
				}

				updateConfig({
					vite: {
						plugins: [
							stylifyVite([defaultConfig, options])
						]
					}
				});

				if ((options.importDefaultBundle ?? true) && generateDefaultBundle) {
					injectScript('page-ssr', `import '${singleBundleOutputFilePath}';`);
				}
			}
		}
	};
};

export default stylify;
