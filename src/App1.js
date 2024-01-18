import { useEffect, useState } from 'react';
import styles from './styles/index.module.css';


function App() {

  const [toDos, setToDos] = useState([])

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/todos')
      .then((loadedData) => loadedData.json())
      .then((loadedToDos) => {
        setToDos(loadedToDos)
      })
  }, [])

  return (
    <div className={styles.container}>
      {toDos.map(({userId, id, title, completed}) => 
        <div key={id} className={styles.toDo} style={{color: completed? 'green': 'red'}}> 
          User id: {userId} <br></br> {title}
        </div>
      )}
    </div>  
  );
}

export default App;
