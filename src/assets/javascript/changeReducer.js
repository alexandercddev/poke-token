const initialState = {}

export const formReducer = (state = {}, action) => {
    switch (action?.type) { 
        case 'update': 
            return ({
                ...state, 
                [action.payload.name]: action.payload.value
            });  
        case 'add': 
            return ({
                ...state, 
                ...action.payload,
            }); 
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