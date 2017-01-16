
import * as closure from '../closure'
import * as history from '../engine/history'


export default function create($element, [ navigationActive, toggleActive ]) {
	let toggled = true;
	closure.classes.enable($element, navigationActive, toggled);

	function toggle() {
		toggled = !toggled;
		showToggle();
	}

	function showToggle() {
		closure.classes.enable($element, navigationActive, toggled);
		targets.findAllElement('toggle').forEach(function($toggle) {
			closure.classes.enable($toggle, toggleActive, toggled);
		});
	}

	function onNavigationClick(e) {
		const $target = e.target;
		const target = $target.target;
		$target.target = '_current';
		setTimeout(() => $target.target = target);
	}

	$element.addEventListener('click', onNavigationClick);

	this.onShortcut('left', function(e) {});
	this.onShortcut('right', function(e) {});
	this.onShortcut('esc', function(e) {
		e.stopPopagation();
		e.preventDefault();

		if (toggled) {
			toggle();

		} else {
			let back = -1;
			let $back = null;
			targets.findAll('title').forEach(function({ $element, data }) {
				if (data>back) {
					back = data;
					$back = $element;
				}
			});

			$back && $back.click();
		}
	});

	const targets = this.createTargets();
	targets.every('toggle', function($target) {
		$target.addEventListener('click', toggle);

		return function() {
			$target.removeEventListener('click', toggle);
		}
	});

	targets.every('title', function($target, { data }) {
		function onTitleClick(e) {
			e.stopPropagation();
			e.preventDefault();

			history.back(data);
		}

		$target.addEventListener('click', onTitleClick);

		return function() {
			$target.removeEventListener('click', onTitleClick);
		}
	});

	targets.complete(showToggle);

	return {
		destroy() {
			$element.removeEventListener('click', onNavigationClick);
		}
	}
}