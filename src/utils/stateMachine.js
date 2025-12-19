class StateMachine {
  constructor(states, transitions) {
    this.states = states;
    this.transitions = transitions;
    this.currentState = null;
  }

  transition(fromState, toState, data = {}) {
    const validTransitions = this.transitions[fromState];
    
    if (!validTransitions) {
      throw new Error(`No transitions defined for state: ${fromState}`);
    }

    if (!validTransitions.includes(toState)) {
      throw new Error(`Invalid transition from ${fromState} to ${toState}`);
    }

    this.currentState = toState;
    return { success: true, fromState, toState, data };
  }

  canTransition(fromState, toState) {
    const validTransitions = this.transitions[fromState];
    return validTransitions && validTransitions.includes(toState);
  }

  getPossibleTransitions(fromState) {
    return this.transitions[fromState] || [];
  }
}

// Book State Machine
const bookStateMachine = new StateMachine(
  ['available', 'borrowed', 'reserved', 'maintenance'],
  {
    available: ['borrowed', 'reserved', 'maintenance'],
    borrowed: ['available', 'overdue', 'maintenance'],
    reserved: ['available', 'borrowed'],
    maintenance: ['available'],
    overdue: ['available', 'maintenance']
  }
);

// Member State Machine
const memberStateMachine = new StateMachine(
  ['active', 'suspended', 'inactive'],
  {
    active: ['suspended', 'inactive'],
    suspended: ['active'],
    inactive: ['active']
  }
);

// Transaction State Machine
const transactionStateMachine = new StateMachine(
  ['active', 'returned', 'overdue', 'cancelled'],
  {
    active: ['returned', 'overdue', 'cancelled'],
    returned: [],
    overdue: ['returned', 'cancelled'],
    cancelled: []
  }
);

module.exports = {
  StateMachine,
  bookStateMachine,
  memberStateMachine,
  transactionStateMachine
};