// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.4/firebase-app.js"; 
import { getFirestore, collection, query, where, getDocs, setDoc, doc, onSnapshot, limit, orderBy } from "https://www.gstatic.com/firebasejs/9.6.4/firebase-firestore.js";
 // https://firebase.google.com/docs/web/setup#available-libraries
import { formReducer } from './changeReducer.js';
import { tableReducer } from './tableReducer.js';
// https://1drv.ms/u/s!AkSiVfLGAjgsg7N0NHZE3Mcbk1RvjA?e=6D46EW
// Your web app's Firebase configuration 
const firebaseConfig = {
  apiKey: "AIzaSyB-pB2V9XPJ67Qliz2UwUoHxT3BfCbHTSA",
  authDomain: "poke-store-8a229.firebaseapp.com",
  projectId: "poke-store-8a229",
  storageBucket: "poke-store-8a229.appspot.com",
  messagingSenderId: "205255129112",
  appId: "1:205255129112:web:ef6c8a9311075b93a66b6d",
  measurementId: "G-DXD1GM5VPW",
  number: '8011380B-9F59-4592-A7DB-AEB5904F2941',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig); 
const db = getFirestore(app);
const searchStore = Redux.createStore(formReducer);
const pokemonsStore = Redux.createStore(tableReducer);
const pokedexStore = Redux.createStore(tableReducer);
const pokemonPokedexStore = Redux.createStore(formReducer);

document.addEventListener('DOMContentLoaded', () => { 
    const pokedexUUID = getPokedexUUID();  
    const searchElement = document.getElementById('search');
    const btnSearchElement = document.getElementById('btn-search');
    const ulPokemontsElement = document.getElementById('pokemons-searchs');
    const rbsType = document.getElementsByName('rb-type');
    const carouselInner = document.querySelector('.carousel-inner');
    const indicators = document.querySelectorAll('.indicator');
    const btnPokedex = document.getElementById('pokedex');
    const numberPokedex = document.getElementById('number-poke-tokens');
    const ulCatch = document.getElementById('items-pokedex');
    const totalDiv = document.getElementById('total');
    const year = document.getElementById('year');
    const loading = document.querySelector('.loading'); 

    year.innerHTML = new Date().getFullYear();

    btnPokedex.addEventListener('click', () => {
        const dropPokedex = document.getElementById('drop-pokedex'); 
        const classList = Array.from(dropPokedex.classList); 
        const isActive = classList.find(item => item == 'active'); 
        if(isActive !== undefined) {
            dropPokedex.classList.remove("active");
        }else {
            dropPokedex.classList.add("active");
        }
    })

    rbsType.forEach(radio => {
        radio.addEventListener('click', ({ target }) => { 
            const { value } = target;
            const li = document.getElementById(`li-${value}`);
            const filters = document.getElementById('filters-ul').getElementsByTagName("li");;
            Array.from(filters).forEach( item => {
                item.classList.remove("active")
            });
            li.classList.add("active");
            searchStore.dispatch({
                type: 'add',
                payload: { type: value.trim().toLowerCase() }
            }); 
        });
    });

    searchElement.addEventListener('change', ({target}) => {
        const { value, name } = target;
        searchStore.dispatch({
            type: 'add',
            payload: { [name]: value.trim().toLowerCase() }
        });
    });

    btnSearchElement.addEventListener('click', async (event) => {
        event.preventDefault();
        loading.classList.add("active");
        const { search } = searchStore.getState(); 
        if(isValid(search)){
            const response = await fetchPokemon({ pokemon: search});
            if(response.succses){
                const {id, name, types, sprites: { other: { dream_world: { front_default: raw } } } } = response; 
                const price = randomPrice(3, 10); 
                const queryById = query(collection(db, "pokemons"), where("id", "==", id));
                const snapshotById = await getDocs(queryById); 
                if(snapshotById.size === 0) {
                    await setDoc(doc(db, "pokemons", `pokemon-${padZeros(id.toString())}`), {
                        id,
                        name,
                        price,
                        raw,
                        sold: false,
                        disabled: false,
                        types: types.map( item => {
                            const { type: { name }} = item;
                            return name ;
                        }),
                    });  
                }    
            }     
        }  
        loading.classList.remove("active");
    });

    indicators.forEach((indicator, position) => {
        indicator.addEventListener('click', () => { 
            let translatex = position * -50; 
            carouselInner.style.transform = `translateX(${translatex}%)`;
            indicators.forEach( item => {
                item.classList.remove('active');
            });
            indicator.classList.add('active');
        });
    });  

    /** Databese realtime **/ 
    const q = query(collection(db, "pokemons"), /*where('types', 'array-contains-any', 'grass'),*/ orderBy("name"), limit(50)); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => { 
        ulPokemontsElement.innerHTML = ""; 
        querySnapshot.forEach((doc) => {  
            const {id, name, price, raw, sold, disabled, types } = doc.data();
            pokemonsStore.dispatch({
                type: 'add',
                payload: { id, name, price, raw, sold, disabled, types }
            });
            ulPokemontsElement.innerHTML = `
                ${ulPokemontsElement.innerHTML}
                <li class="poke-li">
                    <div class="poke-item-li">
                        ${getStrong({sold, disabled})}
                        <img src="${raw}" alt="${name}" loading="lazy" width="250" height="300" />
                        <div class="poke-item-text"> 
                            <strong class="poke-strong">Poke token - No.${padZeros(id.toString())} - in the world</strong> 
                        </div>
                    </div>
                    <div class="poke-item-hover">  
                        <button class="btn-view-token" name="btn-view-token" data-id="${id}"><span>Preview</span></button>
                        ${sold || disabled ? '' : `<button class="btn-add-token" name="btn-add-token" data-id="${id}"><span>Catch it</span></button>`}
                    </div>
                </li>
            `;
        }); 

        /** add events clicks **/
        const buttonsCatch = document.querySelectorAll('[name="btn-add-token"]'); 
        buttonsCatch.forEach( button => { 
            button.addEventListener('click', async ({ target }) => {
                loading.classList.add("active");
                const { id } = target.dataset;  
                const store = pokemonsStore.getState(); 
                const pokemon = store.find( item => item.id == id);  
                pokedexStore.dispatch({
                    type: 'add',
                    payload: { ...pokemon, pokemonId: id, disabled: true }
                });

                await setDoc(doc(db, "pokemons", `pokemon-${padZeros(id.toString())}`), {
                    ...pokemon,
                    disabled: true
                }); 

                const pokedex = pokedexStore.getState();
                await setDoc(doc(db, "pokedex", pokedexUUID), {
                    id: pokedexUUID,
                    pokedex
                }); 
                await waitFor(3000);
                loading.classList.remove("active");
            });
        });

        const buttonsView = document.querySelectorAll('[name="btn-view-token"]');  
        buttonsView.forEach( button => { 
            button.addEventListener('click', async ({ target }) => {
                const { id } = target.dataset;  
                const store = pokemonsStore.getState(); 
                const pokemon = store.find( item => item.id == id);  
                pokemonPokedexStore.dispatch({
                    type: 'init',
                    payload: pokemon
                });
                const pokedexView = document.getElementById('pokedex-view'); 
                const classList = Array.from(pokedexView.classList); 
                const isActive = classList.find(item => item == 'active'); 
                if(isActive !== undefined) {
                    pokedexView.classList.remove("active");
                }else {
                    pokedexView.classList.add("active");
                }
            });
        });
    });

    const closePokedex = document.getElementById('close-pokedex'); 
    closePokedex.addEventListener('click', () => {
        const pokedexView = document.getElementById('pokedex-view'); 
        pokedexView.classList.remove("active");
    });

    /** Databese realtime **/ 
    const queryPokedex = query(collection(db, "pokedex"), where("id", "==", pokedexUUID)); 
    const pokedexUnsubscribe = onSnapshot(queryPokedex, (querySnapshot) => {  
        querySnapshot.forEach((doc) => {  
            const { pokedex } = doc.data(); 
            pokedexStore.dispatch({
                type: 'init',
                payload: pokedex
            });
        });  
    });

    pokedexStore.subscribe(() => {  
        const store = pokedexStore.getState();   
        const innerHTML = store.reduce((innerHTML, pokemon) => {
            const { id, name, raw, price } = pokemon;
            return `
            ${innerHTML ?? ''}
            <li class="poke-item" data-id="${id}">
                <img src="${raw}" alt="Pokemon - ${name}" width="50" heigth="50" />
                <label>${name}</label>
                <strong>${price.toFixed(2)}</strong>
                <button name="btn-remove-token" class="close" data-id="${id}"></button>
            </li>`;
        }, '');
        const total = store.reduce((total, pokemon) => total + pokemon.price, 0);
        ulCatch.innerHTML = innerHTML;
        totalDiv.innerHTML = `Total $ ${total.toFixed(2)} USD`;
        numberPokedex.innerHTML = `(${store.length})`; 

        /** add events clicks **/
        const buttonsRemove = document.querySelectorAll('[name="btn-remove-token"]'); 
        buttonsRemove.forEach( button => {  
            button.addEventListener('click', async ({ target }) => {
                loading.classList.add("active");
                const { id } = target.dataset;   
                const pokemon = store.find( item => item.id === parseInt(id));  
                pokedexStore.dispatch({
                    type: 'remove',
                    payload: parseInt(id)
                });

                await setDoc(doc(db, "pokemons", `pokemon-${padZeros(id.toString())}`), {
                    ...pokemon,
                    disabled: false
                }); 

                const pokedex = pokedexStore.getState();
                await setDoc(doc(db, "pokedex", pokedexUUID), {
                    id: pokedexUUID,
                    pokedex
                }); 
                await waitFor(3000);
                loading.classList.remove("active");
            })
        });
    });

    pokemonPokedexStore.subscribe(() => {
        const { id, name, price, types, raw } = pokemonPokedexStore.getState(); 
        const typesFormat = types.map( type=> ` ${type}`);
        const pokeId = document.getElementById('pokeId');
        const pokeName = document.getElementById('pokeName');
        const pokeTypes = document.getElementById('pokeTypes'); 
        const pokePrice = document.getElementById('pokePrice');
        const pokeImage = document.getElementById('pokeImage');
        pokeImage.src = raw;
        pokeImage.alt = `Pokemon ${id} - ${name}`
        pokeId.innerHTML = padZeros(id.toString());
        pokeName.innerHTML = name;
        pokePrice.innerHTML = `$ ${price} USD`;
        pokeTypes.innerHTML = typesFormat.toString();  
    });
 
});

const fetchPokemon = async ({ pokemon }) => {
    try { 
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`)
            .then(data => data.json());
        return { ...response, succses: true}; 
    }catch (error) { 
        return {
            id: 0,
            name: null,
            price: 0.00,
            raw: null,
            error,
            succses: false
        };
    }
};
 
const randomPrice = (min, max) => {
    const price = Math.random() * (max - min) + min;
    return Number(price.toFixed(2));
}

const padZeros = ( number ) => {
    return number.padStart(3, '000');
}

const isValid = (text) => {
    return text !== undefined ? text.trim().length > 0 : false;
}

const getPokedexUUID = () => {
    const pokeUUID = localStorage.getItem("poke-uuid"); 
    if(pokeUUID === null) {
        const newPokeUUID = `pokedex-${crypto.randomUUID()}`;
        localStorage.setItem("poke-uuid", newPokeUUID);
        return newPokeUUID;
    }else {
        return pokeUUID 
    }  
}

const getStrong = ({sold, disabled}) => {
    if(sold){
        return '<strong>sold</strong>'
    } else if(disabled){
        return '<strong class="disabled">Disabled</strong>'
    }
    return '<strong class="new">New</strong>';
}

const waitFor = ms => new Promise(
    resolve => setTimeout(resolve, ms)
);