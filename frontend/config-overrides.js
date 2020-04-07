const { override, addWebpackModuleRule } = require('customize-cra');
// const { addReactRefresh } = require('customize-cra-react-refresh');

const addWebpackNodeConfig = (nodeConfig) => (config) => {
	config.node = { ...config.node, ...nodeConfig };
	return config;
};

module.exports = override(
	(config) => ({
		...config,
		output: {
			...config.output,
			globalObject: 'this',
		},
	}),
	addWebpackNodeConfig({
		__filename: true,
		__dirname: true,
	})
	// addReactRefresh({ disableRefreshCheck: true })
);
