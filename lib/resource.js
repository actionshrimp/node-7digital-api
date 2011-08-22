var underscore = require('underscore'),
	helpers = require('./helpers'),
	APIRequest = require('./apirequest').APIRequest;

// A resource on the API, this class will build up a method for each action
// that can be performed on the resource.
//
// The `options` argument should have the following properties:
//
// - *resourceDefinition - the definition of the resource and its
//                         actions from the schema definition.
// - *consumerkey* - the oauth consumerkey
// - *consumersecret* the oauth consumersecret
// - *schema* - the schema defintion
// - *format* - the desired response format
// - *logger* - for logging output
function Resource(options) {
	this.format = options.format;
	this.logger = options.logger;
	this.resourceName = options.resourceDefinition.resource;
	this.consumerkey = options.consumerkey;
	this.consumersecret = options.consumersecret;

	this.logger.info('Creating API resource: ' + this.resourceName);
	this.request = new APIRequest(options.schema.host, options.schema.version,
			options.consumerkey, options.consumersecret, options.logger);

	underscore.each(options.resourceDefinition.actions,
		function processAction(action) {
			this.createAction(action, this.request);
		}, this);
}

// Utility method for creating the necessary methods on the Resource for
// dispatching the request to the 7digital API.
//
// - @param {Mixed} actionDefinition - Either a string if the action method
// name is the same as the action path component on the underlying API call
// or a hash if they differ.
//
// - @param {Object} actionDefinition
Resource.prototype.createAction = function (actionDefinition) {
	var fnName;

	// Default the action name to getXXX if we only have the URL slug as the
	// action definition.
	if (underscore.isString(actionDefinition)) {
		fnName = 'get' + helpers.capitalize(actionDefinition);
	} else {
		fnName = actionDefinition.methodName;
		actionDefinition = actionDefinition.apiCall;
	}

	this.logger.info('Creating action: ' + fnName);
	this[fnName] = function (params, callback) {
		// Dispatch the request to the API binding the request parser to the
		// callback when the response returns.
		this.request.doGetRequest(actionDefinition, params,
			underscore.bind(this.request.parseResponse, this.request,
							callback));
	};
};

module.exports = Resource;