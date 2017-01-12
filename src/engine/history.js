
import Kefir from 'kefir'
import shallowEqual from '../lib/shallowEqual'
import closure from '../closure'

if (window.history && window.history.scrollRestoration) {
	window.history.scrollRestoration = 'manual';
}

const _supported = !!(window.history && window.history.pushState);
let _merging = false;
let _mergeEmitter = null;

Kefir.stream(emitter => { _mergeEmitter = emitter; })
	.filter(value => isSupported())
	.map(value => ({..._state, ...value}))
	.filter(state => _merging = _merging || !shallowEqual(_state, state))
	.onValue(state => _state = state)
	.debounce(100)
	.onValue(commitMergeState);

const _events = {};
let _canceling = false;
let _session = '';
let _id = 0;
let _firstlink = window.location.href;
let _state = window.history.state||{};
let _link = closure.uri.change(window.location.href);
let _origin = _state.origin || _link;

const matched = String(_state._id).match(/^(.*)_([0-9]+)$/);

if (matched) {
	_session = matched[1];
	_id = parseInt(matched[2], 10);

} else {
	_session = closure.string.getRandomString();
	mergeState(createState({}, true))
}

let requestTree = [_state._id];
let requestTreePosition = 0;

function createId(newId) {
	return (_state && _state._id && newId) ? _state._id : (_session + '_' + String(++_id));
}

function createState(state={}, initial=false) {
	return {...state,
		_id: createId(false),
		initial: initial,
	};
}

export function isSupported() {
	return _supported;
}

export function isInitial() {
	return state('initial', false);
}

export function getCanonizedLink(link) {
	return closure.uri.areSame(link, _origin) ? _link : link;
}

export function getLink() {
	return _link;
}

export function getLinks() {
	return [_link, _origin];
}

export function state(key, defval) {
	return key ? (_state[key]||defval) : {..._state};
}

export function popstate(fn) {
	const popstate = e => fn(e, window.location.href);

	_supported && window.addEventListener('popstate', popstate);
	return function() {
		_supported && window.removeEventListener('popstate', popstate);
	}
}

popstate((e, link) => {
	if (_canceling===false && link===_firstlink) {
		_firstlink = null;
		e.stopPropagation();
		e.stopImmediatePropagation();

	} else {
		_merging = false;
		_firstlink = null;
		_state = window.history.state||{};
		_link = closure.uri.change(link);
		_origin = _state.origin || _link;

		requestTreePosition = requestTree.lastIndexOf(_state._id, requestTreePosition-1);

		dispatch('change');

		if (_canceling) {
			_canceling = false;
			e.stopPropagation();
			e.stopImmediatePropagation();
		}
	}
})

export function onPush(fn) {
	return createEvent('push', fn);
}

export function onReplace(fn) {
	return createEvent('replace', fn);
}

export function onChange(fn) {
	fn(closure.uri.create());
	return createEvent('change', fn);
}

function createEvent(name, fn) {
	const items = _events[name] = _events[name] || [];
	items.push(fn);

	return function off() {
		if (items.indexOf(fn)!==-1) {
			items.splice(items.indexOf(fn), 1);
		}
	}
}

function dispatch(name) {
	(_events[name]||[]).forEach(fn => fn());
}

export function mergeState(state={}) {
	_mergeEmitter.emit(state);
}

function commitMergeState() {
	if (_merging) {
		_merging = false;

		if (_supported) {
			window.history.replaceState(_state, document.title, getLink());
		}
	}
}

export function cancelState() {
	_canceling = true;
	_supported ? window.history.back() : null;
}

export function replaceState(state={}, link) {
	closure.uri.isSame(link) && _link!==_origin && (state.origin = _origin);
	changeState(state, link, 'replaceState', 'replace');
}

export function pushState(state={}, link) {
	if (_canceling) {
		_canceling = false;
		replaceState(state, link);

	} else {
		commitMergeState();
		requestTree.splice(++requestTreePosition, requestTree.length, _state._id);
		changeState(state, link, 'pushState', 'push');
	}
}

export function redirectState(state={}, link) {
	changeState({...state, origin: _origin}, link, 'replaceState', 'replace');
}

function changeState(state, link, method, invoke) {
	_firstlink = null;
	_merging = false;
	_state = createState(state);
	_link = closure.uri.change(link);
	_origin = _state.origin || _link;

	if (_supported) {
		window.history[method](_state, '', _link);

	} else {
		window.redirect(_link);
	}

	dispatch(invoke);
	dispatch('change');
}

export function changeId() {
	const _id = createId(true);
	requestTree[requestTreePosition] = _id;
	return mergeState({ _id });
}

export function getCurrentId() {
	return _state._id||'';
}

export function getCurrentTree() {
	return requestTree.slice(0, requestTreePosition+1);
}

export function getLength() {
	return _supported ? window.history.length : 1;
}

export function back() {
	_supported ? window.history.back() : null;
}

export function go(...args) {
	_firstlink = null;
	_supported ? window.history.go(...args) : null;
}
