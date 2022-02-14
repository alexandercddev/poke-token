const initialState = []

export const tableReducer = (state = [], action) => {
    switch (action?.type) { 
        case 'update': 
        const {id} = action.payload;
            return state.map( item => (
                id === item.id ? payload : item
            ));
        case 'add': 
            return ([
                ...state, 
                action.payload,
            ]); 
        case 'remove':  
            return state.filter(item => item.id !== action.payload);
        case 'reset':
            return {
                ...initialState,
                ...action.payload,
            };
        case 'init':
            return action.payload;
        default: return state
    }
}