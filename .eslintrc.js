/*globals module*/
module.exports = {
	"env": {
		"browser": true,
		"es6": true
	},
	"globals": {
		"$": "readonly",
		"$new":"readonly",
		"$each":"readonly",
		"R4": "readonly",
		"_CONFIG": "readonly",
		"Basico": "readonly",
		"Dialog":"readonly",
		"Table":"readonly",
		"Tabs":"readonly",
		"Icons":"readonly",
		"Warning":"readonly",
		"Fields":"readonly",
		"FieldsTags":"readonly",
		"FieldsDtPicker":"readonly",
		"Pop":"readonly",
		"Effects":"readonly"
	},
	"extends": "eslint:recommended",
	"rules": {
		"no-case-declarations": "off",
		"linebreak-style": ["error", "unix"],
		"semi": ["error", "always"],
		"no-mixed-spaces-and-tabs": "warn",
		"no-empty": "warn",
		"no-constructor-return": "error",
		"block-scoped-var": "error",
		"dot-notation": "warn",
		// "guard-for-in": "warn",
		// "no-console": "warn",
		"no-eq-null": "warn",
		"no-shadow-restricted-names": "error",
		"no-useless-catch": "error",
		"no-useless-return": "warn"
	}
};
