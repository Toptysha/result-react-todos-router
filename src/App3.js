import { useEffect, useState } from 'react';
import styles from './styles/index.module.css';
import { useForm } from 'react-hook-form';
import * as yup from 'yup'
import {yupResolver} from '@hookform/resolvers/yup'
import { debounce } from 'lodash';
import { onValue, push, ref, remove, set } from 'firebase/database';
import { db } from './firebase';

const fieldsScheme = yup.object().shape({
  userName: yup
      .string()
      .matches(/^([a-zA-Zа-яА-Я._-]+)*$/, 
        'ERROR: Имя должно содержать только кириллицу, латиницу, ".", "_" и "-"')
      .max(20, 'ERROR: Имя не должен быть длиннее 20 символов')
      .required('Все поля являются обязательными'),
  toDo: yup
      .string()
      .min(4, 'ERROR: новое дело не должен быть короче 4 символов')
      .required('Все поля являются обязательными'),
})

function sortByAlphabet(toDos) {
  return Object.values(toDos).sort((a, b) => {
    if (a.toDo.toLowerCase() < b.toDo.toLowerCase()) {
      return -1;
    }
    if (a.toDo.toLowerCase() > b.toDo.toLowerCase()) {
      return 1;
    }
    return 0;
  });
}

function App() {

  const [toDos, setToDos] = useState({})
  const [newName, setNewName] = useState('')
  const [newToDo, setNewToDo] = useState('')
  const [sortByAlphabetFlag, setSortByAlphabetFlag] = useState(false)
  const [search, setSearch] = useState('')
  const [searchFlag, setSearchFlag] = useState(false)

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: {
        userName: '',
        toDo: ''
    },
    resolver: yupResolver(fieldsScheme)
  });

  const error = errors.userName?.message || errors.toDo?.message

  const requestAddToDo = (formData) => {

    const toDosDbRef = ref(db, 'toDos')

    push(toDosDbRef, {...formData, completed: false})
  }

  let searchToDo = debounce((loadedToDos) => {
    if (loadedToDos) {
      setToDos(Object.values(loadedToDos).filter(({toDo}) => toDo.includes(search)))
    }
  }, 10);

  useEffect(() => {
    const toDosDbRef = ref(db, 'toDos')

    return onValue(toDosDbRef, (snapshot) => {
      const loadedToDos = snapshot.val() || {}

      if (!sortByAlphabetFlag) {
        setToDos(loadedToDos)
      } else {
        setToDos(sortByAlphabet(loadedToDos))
      }

      if (search) {
        searchToDo(loadedToDos)
      }
    })
  }, [sortByAlphabetFlag, search])

  const setDisplayCurrentDiv = (id, datasetName) => {
    const currentDiv = document.querySelector(`[${datasetName}='${id}']`)
    currentDiv.style.display = currentDiv.style.display === 'block'? 'none' : 'block'
  }

  const changeNameOnToDo = (id) => {

    const toDosIdRef = ref(db, `toDos/${id}`)

    set(toDosIdRef, {...toDos[`${id}`], userName: newName})
  }
  
  const changeToDoOnToDo = (id) => {

    const toDosIdRef = ref(db, `toDos/${id}`)

    set(toDosIdRef, {...toDos[`${id}`], toDo: newToDo})
  }
  
  const changeCompletedOnToDo = (id) => {

    const toDosIdRef = ref(db, `toDos/${id}`)

    set(toDosIdRef, {...toDos[`${id}`], completed: !toDos[`${id}`].completed}) 
  }

  const deleteToDo = (id) => {

    const toDosIdRef = ref(db, `toDos/${id}`)

    remove(toDosIdRef)
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(requestAddToDo)} className={styles.formContainer}>
        <div>
          {error && <div className={styles.errorLabel}>{error}</div>}

          <h2>Имя:</h2>
          <input 
              type='text' 
              {...register('userName')}
              placeholder='Введите имя'
          ></input>

          <h2>Новая задача:</h2>
          <input
              type='text'
              {...register('toDo')}
              placeholder='Введите новую Задачу'
          ></input>
        </div>

        <button  className={styles.createToDo} disabled={!!error}>Создать задачу</button>
      </form>

      <div>
        <button type='submit' className={styles.sortByAlphabet} onClick={() => setSortByAlphabetFlag(!sortByAlphabetFlag)}>Сортировать по алфавиту</button>
          <input
            type='text' 
            placeholder='Поиск по задачам'
            onChange={({target}) => {
              setSearch(target.value)
              setSearchFlag(!searchFlag)
              }}
          ></input>
      </div>

      {Object.entries(toDos).map(([id, {userName, toDo, completed}]) => 
        <div key={id} className={styles.toDo}> 
          Имя: {userName} <br></br> Задача: <span className='toDoSpan' style={{color: completed? 'green': 'red'}}>{toDo}</span>

            <div data-name-id={id} className={styles.changeInfo}>
              <input 
                  type='text' 
                  placeholder='Введите имя'
                  className={styles.newName}
                  onChange={({target}) => setNewName(target.value)}
              ></input>
              <button data-id={id} className={styles.confirmChanges} onClick={(event) => changeNameOnToDo(event.target.dataset.id)}>Подтвердить изменения</button>
            </div>

            <div data-to-do-id={id} className={styles.changeInfo}>
              <input
                  type='text'
                  placeholder='Введите новую задачу'
                  className={styles.newToDo}
                  onChange={({target}) => setNewToDo(target.value)}
              ></input>
              <button data-id={id} className={styles.confirmChanges} onClick={(event) => changeToDoOnToDo(event.target.dataset.id)}>Подтвердить изменения</button>
            </div>

          <div className={styles.toDoButtons}>
            <button data-id={id} className={styles.changeInfoButton} disabled={false} onClick={(event) => {setDisplayCurrentDiv(event.target.dataset.id, 'data-name-id')}}>
              Изменить имя
            </button>
            <button data-id={id} className={styles.changeInfoButton} disabled={false} onClick={(event) => {setDisplayCurrentDiv(event.target.dataset.id, 'data-to-do-id')}}>
              Изменить задачу
            </button>
            <button data-id={id} onClick={(event) => changeCompletedOnToDo(event.target.dataset.id)} className={styles.changeInfoButton} disabled={false}>Изменить статус</button>
          </div>
          <button data-id={id} onClick={(event) => deleteToDo(event.target.dataset.id)} className={styles.deleteButton} disabled={false}>Удалить</button>
        </div>
      )}
    </div>  
  );
}

export default App;
