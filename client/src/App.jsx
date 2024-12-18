import './App.css'
import { useState, useEffect } from 'react'
import Axios from 'axios'

function App() {
const [password, setPassword] = useState('');
const [title, setTitle] = useState('');
const [passwordList, setPasswordList] = useState([]);

useEffect(() => {
  Axios.get('http://localhost:3001/showpasswords').then((response) => {
    console.log(response.data);
    setPasswordList(response.data);
  });
}, []);

const addPassword = () => {
  Axios.post('http://localhost:3001/addpassword', {
    password: password,
    title: title,
  });
  console.log("Wykonano addPassword");
};

const decryptPassword = (encryption) => {
   Axios.post('http://localhost:3001/decryptpassword', {
      password: encryption.password,
      iv: encryption.iv,
   }).then((response) => {
      setPasswordList(passwordList.map((val) => {
        return val.id == encryption.id ? {
          id: val.id, 
          password: val.password, 
          title: response.data, 
          iv: val.iv
        } 
          : val;
      }));
   });
};

  return <div className="App">
    <div className="AddPassword">
      <input type="text" placeholder="Youtube" onChange={(event) => {setTitle(event.target.value)}}></input>
      <input type="text" placeholder="hasło123" onChange={(event) => {setPassword(event.target.value)}}></input>
      <button onClick={addPassword}>Dodaj hasło</button>
    </div>
    <div className='Passwords'>
      {passwordList.map((val) => {
        return (
          <div className='Password' onClick={() => {
            decryptPassword({
              password: val.password, 
              iv: val.iv,
              id: val.id
              })}}>
            <h3>{val.title}</h3>
          </div>
        );
      })}
    </div>
  </div>
}

export default App
