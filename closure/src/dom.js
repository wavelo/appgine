
goog.module('dom');

goog.require('uri');
goog.require('goog.dom');
goog.require('goog.array');
goog.require('goog.crypt');
goog.require('goog.crypt.Md5');



exports.setTextContent = goog.dom.setTextContent;
exports.setProperties = goog.dom.setProperties;
exports.createDom = goog.dom.createDom;
exports.getChildren = goog.dom.getChildren;
exports.removeChildren = goog.dom.removeChildren;
exports.contains = function(parent, descendant) {
	return parent && descendant ? goog.dom.contains(parent, descendant) : false;
};

exports.compareNodeOrder = goog.dom.compareNodeOrder;
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

exports.isFormTag = function($element) {
	if (!$element) {
		return false;
	}

	var tagName = String($element.tagName).toLowerCase();

	if (tagName==='input') {
		return true;

	} else if (tagName==='button') {
		return true;

	} else if (tagName==='textarea') {
		return true;

	} else if (tagName==='select') {
		return true;
	}

	return false;
}

exports.isFormElement = function($element) {
	return exports.isFormTag($element) && $element.name && $element.form;
}

exports.shouldHaveFormId = function($form) {
	for (i=0; i<$form.elements.length; i++) {
		var $element = $form.elements[i];

		if (String($element.tagName).toLowerCase()==='button') {
			continue;

		} else if (String($element.type).toLowerCase()==='hidden') {
			continue;

		} else if (String($element.type).toLowerCase()==='submit') {
			continue;
		}

		return true;
	}

	return false;
}

var md5;
exports.createFormId = function($form) {
	var names = [
		uri.createFormAction($form),
		String($form.method||'GET'),
		String($form.name||'')
	];

	if ($form.elements.length>0) {
		goog.array.forEach($form.elements, function($element) {
			names.push(String($element.name||''));
		});
	}

	md5 = md5 || new goog.crypt.Md5();
	md5.reset();
	md5.update(names.join('\n'));
	return goog.crypt.byteArrayToHex(md5.digest());
}


exports.findForm = function(formName, formId) {
	if (formName) {
		return document.forms[formName]

	} else if (formId) {
		for (var i=0; i<document.forms.length; i++) {
			if (formId===exports.createFormId(document.forms[i])) {
				return document.forms[i];
			}
		}
	}
}
