
import querySelectorAll from '../lib/plugins/lib/querySelectorAll'
import resolveDataAttribute from '../lib/plugins/lib/resolveDataAttribute'

import { dom } from '../lib/closure'
import withContext from 'appgine/hooks'
import { useContext, withErrorCatch } from 'appgine/hooks'

let completed = false;
let completedTimeout = null;

const containerPointer = [];
const containerNodes = {};
const internalPlugins = [];
const internalComplete = [];
let internalTargets = [];

export function useTargets(target, fn) {
	const plugin = { containers: [], results: [], targets: [], target, fn };

	useContext(context => {
		if (context.$element) {
			plugin.context = context;
			plugin.$element = context.$element;

			internalPlugins.push(plugin);

			pointer:
			for (let pointer=0; pointer<containerPointer.length; pointer++) {
				if (containerPointer[pointer]!==undefined) {
					for (const $containerNode of containerNodes[pointer]) {
						if (dom.contains($containerNode, plugin.$element)) {
							plugin.containers.push(containerPointer[pointer]);
							continue pointer;
						}
					}
				}
			}

			if (completed) {
				completePluginTargets(plugin);
				completedTimeout = completedTimeout || setTimeout(completeTargets, 0);
			}

			return function() {
				for (let complete of internalComplete) {
					if (complete.completeContext && complete.context===plugin.context) {
						complete.completeContext();
						complete.completeContext = null;
					}
				}

				if (internalPlugins.indexOf(plugin)!==-1) {
					internalPlugins.splice(internalPlugins.indexOf(plugin), 1);
				}

				plugin.results.splice(0, plugin.results.length);
				plugin.targets.splice(0, plugin.targets.length).forEach(({ context }) => context());
			}
		}
	});

	return plugin.results;
}


export function useComplete(fn) {
	const plugin = { completeContext: null, fn }

	useContext(context => {
		if (context.$element) {
			plugin.context = context;
			plugin.$element = context.$element;

			internalComplete.push(plugin);

			if (completed) {
				completedTimeout = completedTimeout || setTimeout(completeTargets, 0);
			}

			return function() {
				if (internalComplete.indexOf(plugin)!==-1) {
					internalComplete.splice(internalComplete.indexOf(plugin), 1);
				}

				plugin.completeContext && plugin.completeContext();
				plugin.completeContext = null;
			}
		}
	});
}


export function swapDocument(fn)
{
	completed = false;
	removeContainer('document', document);
	fn && fn();
	addContainer('document', document);
	completed = true;
	completeTargets();
}


export function completeTargets()
{
	clearTimeout(completedTimeout);
	completedTimeout = null;

	if (completed) {
		internalPlugins.forEach(completePluginTargets);
		internalComplete.forEach(completePlugin);
	}
}


export function addContainer(container, $node) {
	let pointer = containerPointer.indexOf(container);

	if (pointer===-1) {
		pointer = containerPointer.push(container)-1;
		containerNodes[pointer] = [];
	}

	containerNodes[pointer].push($node);

	for (let plugin of internalPlugins) {
		if (plugin.containers.indexOf(container)===-1) {
			if (dom.contains($node, plugin.$element)) {
				plugin.containers.push(container);
			}
		}
	}

	querySelectorAll($node, '[data-target]').forEach(function($element) {
		let found = false;
		for (let target of internalTargets) {
			if (target.$element===$element) {
				found = true;
				if (target.containers.indexOf(container)===-1) {
					target.containers.push(container);
				}
			}
		}

		if (found===false) {
			resolveDataAttribute($element, 'data-target', function(target) {
				target.$element = $element;
				target.containers = [container];
				internalTargets.push(target);
			});
		}
	});
}


export function removeContainer(container, $node) {
	let pointer = containerPointer.indexOf(container);

	if (pointer===-1) {
		return;
	}

	if (completed) {
		completed = false;

		for (let complete of internalComplete) {
			complete.completeContext && complete.completeContext();
			complete.completeContext = null;
		}
	}

	if (containerNodes[pointer].indexOf($node)!==-1) {
		containerNodes[pointer].splice(containerNodes[pointer].indexOf($node), 1);
	}

	for (let target of internalTargets) {
		if (target.containers.indexOf(container)!==-1) {
			if (containerNodes[pointer].length===0 || dom.contains($node, target.$element)) {
				target.containers.splice(target.containers.indexOf(container), 1);
			}
		}
	}

	for (let plugin of internalPlugins) {
		if (plugin.containers.indexOf(container)!==-1) {
			if (containerNodes[pointer].length===0 || dom.contains($node, plugin.$element)) {
				plugin.containers.splice(plugin.containers.indexOf(container), 1);
			}
		}

		plugin.targets = plugin.targets.filter(function({ target, context }) {
			if (plugin.containers.length>0 && target.containers.length>0 && plugin.containers.some(container => target.containers.indexOf(container))) {
				return true;
			}

			context && context();
		});
	}

	internalTargets = internalTargets.filter(target => target.containers.length>0);

	if (containerNodes[pointer].length===0) {
		containerPointer[pointer] = undefined;
	}
}


function completePlugin(plugin) {
	if (plugin.$element.ownerDocument!==document) {
		return;
	}

	if (plugin.completeContext===null) {
		plugin.completeContext = withContext({}, () => withErrorCatch('useComplete', plugin.fn));
	}
}


function completePluginTargets(plugin) {
	if (plugin.$element.ownerDocument!==document) {
		return;
	}

	for (let target of internalTargets) {
		if (target.$element.ownerDocument!==document) {
			continue;

		} else if (plugin.targets.some(targetObj => targetObj.target===target)) {
			continue;

		} else if (matchTargetPlugin(plugin.context, target)===false) {
			continue;

		} else if (matchTarget(plugin.target, target.target)===false) {
			continue;
		}

		const contextArgs = [target.$element, {...target, data: target.createData()}];
		const context = withContext(target, function() {
			const result = withErrorCatch('useTargets', plugin.fn, contextArgs);

			if (result!==undefined) {
				plugin.results.push(result);
			}

			return function() {
				if (plugin.results.indexOf(result)!==-1) {
					plugin.results.splice(plugin.results.indexOf(result), 1);
				}
			}
		});

		plugin.targets.push({ target, context });
	}
}


function matchTargetPlugin(plugin, target) {
	return plugin.name===target.name || (target.pluginName==='this' && dom.contains(plugin.$element, target.$element));
}


function matchTarget(pluginTarget, target) {
	return (pluginTarget==='' || pluginTarget===target || (Array.isArray(pluginTarget) && pluginTarget.indexOf(target)!==-1));
}