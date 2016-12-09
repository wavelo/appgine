
goog.module('dom');

goog.require('goog.dom');
goog.require('goog.array');


exports.setTextContent = goog.dom.setTextContent;
exports.setProperties = goog.dom.setProperties;
exports.createDom = goog.dom.createDom;
exports.getChildren = goog.dom.getChildren;
exports.removeChildren = goog.dom.removeChildren;
exports.contains = function(parent, descendant) {
	return parent && descendant ? goog.dom.contains(parent, descendant) : false;
};

exports.append = goog.dom.append;
exports.getAncestorByClass = goog.dom.getAncestorByClass;
exports.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
exports.getNextElementSibling = goog.dom.getNextElementSibling;
exports.getLink = function(target) {
	return exports.getAncestor(target, 'a');
}

exports.getAncestor = function(target, matcher) {
	var $target = target.target||target;

	if (goog.isFunction(matcher)) {
		return goog.dom.getAncestor($target, matcher, true);
	}

	var args;
	args = [].slice.call(arguments, 1);
	args = goog.array.map(args, function(tagName) {
		return tagName.toUpperCase();
	});

	return goog.dom.getAncestor($target, function(node) {
		return args.indexOf(node.nodeName)!==-1;
	}, true);
}

exports.getSubmitter = function(target) {
	return goog.dom.getAncestor(target.target || target, function($node) {
		return String($node.type).toLowerCase()==='submit';
	}, true);
}