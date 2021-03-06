
import { useAppProgress } from 'appgine/hooks/progress'
import { bindTimeout, useTimeout } from 'appgine/hooks/timer'


export default function create($root) {
	const $container = $root.children[0] && $root.children[0].tagName=='DIV' && $root.children[0] || document.createElement('div');

	$root.classList.add('progress');
	$root.appendChild($container);

	useAppProgress($container.animate ? createJSProgress($container) : createCSSProgress($root, $container));
}


function createCSSProgress($root, $container)
{
	const [ usePendingTimeout, destroyPendingTimeout ] = bindTimeout();

	return function() {
		destroyPendingTimeout();
		$root.classList.remove('progress-loading', 'progress-loaded', 'progress-hidden');

		useTimeout(() => {
			$root.classList.add('progress-loading');
			$container.style.width = '';
			$container.style.animationDuration = '';
		}, 0);

		return {
			response() {
				$container.style.width = $container.getBoundingClientRect().width + 'px';
				$root.classList.remove('progress-loading');
			},
			replace() {},
			end() {
				$root.classList.remove('progress-loading');
				$container.style.width = '';
				$container.style.animationDuration = '';
				$root.classList.add('progress-loaded');

				usePendingTimeout(() => $root.classList.add('progress-hidden'), 1000);
			},
			abort() {
				$root.classList.remove('progress-loading');
				$container.style.width = '';
				$container.style.animationDuration = '';
			},
			destroy() {
				$container.style.width = '';
				$container.style.animationDuration = '';
				$root.classList.remove('progress-loading', 'progress-loaded', 'progress-hidden');
			},
		}
	}
}


function createJSProgress($container)
{
	let jsAnimation = null;

	return function() {
		$container.style.width = '0%';
		$container.style.visibility = '';

		useTimeout(() => {
			jsAnimation && jsAnimation.cancel();
			jsAnimation = $container.animate([
				{width: '2%', offset: 0.0},
				{width: '10%', offset: 0.008},
				{width: '15%', offset: 0.015},
				{width: '20%', offset: 0.025},
				{width: '40%', offset: 0.05},
				{width: '50%', offset: 0.065},
				{width: '60%', offset: 0.08},
				{width: '65%', offset: 0.09},
				{width: '70%', offset: 0.125},
				{width: '75%', offset: 0.15},
				{width: '76%', offset: 0.20},
				{width: '76.5%', offset: 0.25},
				{width: '77%', offset: 0.35},
				{width: '77.5%', offset: 0.50},
				{width: '78%', offset: 0.70},
				{width: '79%', offset: 0.80},
				{width: '79.5%', offset: 0.90},
				{width: '80%', offset: 1.00}
			], {
				duration: 50000,
			});

			const animation = jsAnimation;
			jsAnimation.onfinish = function() {
				if (jsAnimation===animation) {
					jsAnimation = undefined;
					$container.style.width = '80%';
				}
			}
		}, 0);

		function endAnimation() {
			jsAnimation && jsAnimation.pause();

			const width = $container.getBoundingClientRect().width;
			const parentWidth = $container.parentNode.getBoundingClientRect().width;
			const start = width/parentWidth*100;

			jsAnimation && jsAnimation.cancel();
			jsAnimation = $container.animate([
				{width: String(start)+'%', opacity: 1.0, offset: 0.0},
				{width: '100%', opacity: 1.0, offset: start<50 ? 0.5 : 0.33},
				{width: '100%', opacity: 1.0, offset: 0.66},
				{width: '100%', opacity: 0.0, offset: 1.0},
			], {
				duration: start<50 ? 600 : 450,
			});

			const animation = jsAnimation;
			jsAnimation.onfinish = function() {
				if (jsAnimation===animation) {
					jsAnimation = undefined;
					$container.style.visibility = 'hidden';
				}
			}
		}

		return {
			response() {},
			replace() {},
			end() {
				if (!jsAnimation || jsAnimation.playState==='running') {
					endAnimation();

				} else if (jsAnimation.playbackRate===undefined) {
					jsAnimation.cancel();
					endAnimation();

				} else {
					jsAnimation.onfinish = endAnimation;
					jsAnimation.playbackRate = 500;
				}
			},
			abort() {
				$container.style.visibility = 'hidden';
			},
			destroy() {
				jsAnimation && jsAnimation.cancel();
			},
		}
	}
}
