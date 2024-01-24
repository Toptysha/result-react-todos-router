import { useEffect, useRef, useState } from 'react';
import styles from './styles/index.module.css';
import { useForm } from 'react-hook-form';
import * as yup from 'yup'
import {yupResolver} from '@hookform/resolvers/yup'
import { debounce } from 'lodash';
import { NavLink, Route, Routes, useParams, useNavigate, Navigate } from 'react-router-dom';

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
  return toDos.sort((a, b) => {
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

  const [toDos, setToDos] = useState([])
  const [refreshToDosFlag, setRefreshToDosFlag] = useState(false)
  const [sortByAlphabetFlag, setSortByAlphabetFlag] = useState(false)
  const [search, setSearch] = useState('')
  const [searchFlag, setSearchFlag] = useState(false)

  const newName = useRef('')
  const newToDo = useRef('')

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
    fetch('http://localhost:3005/toDos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify({...formData, completed: false})
    })
        .then((rawResponse) => rawResponse.json())
        .then((response) => {
          console.log('Server response:', response)
          setRefreshToDosFlag(!refreshToDosFlag)
        })
  }

  useEffect(() => {
    fetch('http://localhost:3005/toDos')
      .then((loadedData) => loadedData.json())
      .then((loadedToDos) => {
        if (!sortByAlphabetFlag) {
          setToDos(loadedToDos)
        } else {
          setToDos(sortByAlphabet(loadedToDos))
        }  
      })
  }, [refreshToDosFlag, sortByAlphabetFlag])

  let searchToDo = debounce(() => {
    fetch('http://localhost:3005/toDos')
      .then((loadedData) => loadedData.json())
      .then((loadedToDos) => {setToDos(loadedToDos.filter(({toDo}) => toDo.includes(search))); console.log(search)})
  }, 500);

    useEffect(() => {
      searchToDo()
    }, [searchFlag])

  const setDisplayCurrentDiv = (id, datasetName) => {
    const currentDiv = document.querySelector(`[${datasetName}='${id}']`)
    currentDiv.style.display = currentDiv.style.display === 'block'? 'none' : 'block'
  }

  const changeNameOnToDo = (id) => {
    fetch(`http://localhost:3005/toDos/${id}`)
      .then((rawResponse) => rawResponse.json())
      .then((response) => {
        fetch(`http://localhost:3005/toDos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          body: JSON.stringify({...response, userName: newName.current})
        })
            .then((rawResponse) => rawResponse.json())
            .then((response) => {
              console.log('Server response:', response)
              setRefreshToDosFlag(!refreshToDosFlag)
            })
            .finally(setDisplayCurrentDiv(id, 'data-name-id'))
      })
  }
  
  const changeToDoOnToDo = (id) => {
    fetch(`http://localhost:3005/toDos/${id}`)
      .then((rawResponse) => rawResponse.json())
      .then((response) => {
        fetch(`http://localhost:3005/toDos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          body: JSON.stringify({...response, toDo: newToDo.current})
        })
            .then((rawResponse) => rawResponse.json())
            .then((response) => {
              console.log('Server response:', response)
              setRefreshToDosFlag(!refreshToDosFlag)
            })
            .finally(setDisplayCurrentDiv(id, 'data-to-do-id'))
      })
  }
  
  const changeCompletedOnToDo = (id) => {
    fetch(`http://localhost:3005/toDos/${id}`)
      .then((rawResponse) => rawResponse.json())
      .then((response) => {
        fetch(`http://localhost:3005/toDos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          body: JSON.stringify({...response, completed: response.completed? false: true})
        })
            .then((rawResponse) => rawResponse.json())
            .then((response) => {
              console.log('Server response:', response)
              setRefreshToDosFlag(!refreshToDosFlag)
            })
      })  
  }

  const deleteToDo = (id) => {
    fetch(`http://localhost:3005/toDos/${id}`)
      .then(
        fetch(`http://localhost:3005/toDos/${id}`, {method: 'DELETE'})
          .then((response) => {
            console.log('Server response:', response)
            setRefreshToDosFlag(!refreshToDosFlag)
            window.location.assign('/')  
          })
      )
  }

  const MainPage = () => (
    <>
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
            value={search}
          ></input>
      </div>

      {toDos.map(({id, toDo, completed}) => 
        <div key={id} className={styles.toDo}>
          <NavLink to={`task/${id}`}>Задача: <span className={styles.toDoSpan} style={{color: completed? 'green': 'red'}}>{toDo.length >= 40? `${toDo.slice(0, 40)}...` : toDo}</span></NavLink>
        </div>
      )}
    </>
  )

  const Task = () => {

    const params = useParams()
    const navigate = useNavigate();

    const currentToDo = toDos.find((toDo) => toDo.id === params.id)

    if (currentToDo) {
      const {userName, id, toDo, completed} = currentToDo

      return (
        <>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>Назад!</button>
          <div key={id} className={styles.toDo}> 
            Имя: {userName} <br></br> Задача: <span className='toDoSpan' style={{color: completed? 'green': 'red'}}>{toDo}</span>

              <div data-name-id={id} className={styles.changeInfo}>
                <input 
                    type='text' 
                    placeholder='Введите имя'
                    className={styles.newName}
                    onChange={({target}) => newName.current = target.value}
                ></input>
                <button data-id={id} className={styles.confirmChanges} onClick={(event) => changeNameOnToDo(event.target.dataset.id)}>Подтвердить изменения</button>
              </div>

              <div data-to-do-id={id} className={styles.changeInfo}>
                <input
                    type='text'
                    placeholder='Введите новую задачу'
                    className={styles.newToDo}
                    onChange={({target}) => newToDo.current = target.value}
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
        </>
      )
    } else {
      return (
      <div className={styles.err404}> Error 404: Задача не найдена</div>
      )
    }
  }

  const NotFound = () => (
    <div className={styles.err404}> Error 404: Такой страницы не существует</div>
  )
    
  return (

    <div className={styles.container}>
      <Routes>
        <Route path='/' element={MainPage()} />
        <Route path='/task/:id' element=<Task /> />
        <Route path='/404' element=<NotFound /> />
        <Route path='*' element=<Navigate to="/404" /> />
      </Routes> 
    </div>  
  );
}

export default App;
