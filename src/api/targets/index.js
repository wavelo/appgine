
import TargetList from './TargetList'


export default {
	createTargets(state, ...args) {
		const fn = args.pop();
		state = new TargetList(...args);
		fn(state);
		return state;
	}
}