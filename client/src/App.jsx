import './App.css';
import { useState, useEffect } from 'react';
import Axios from 'axios';
import Swal from 'sweetalert2';

function App() {
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [passwordList, setPasswordList] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  
  // Pobieranie haseł
  const fetchPasswords = () => {
    Axios.get('http://localhost:3001/showpasswords')
      .then((response) => {
        setPasswordList(
          response.data.map((val) => ({
            ...val,
            isDecrypted: false,
            originalTitle: val.title,
          }))
        );
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Błąd!',
          text: 'Nie udało się załadować haseł.',
          confirmButtonColor: '#28a745',
        });
        console.error(error);
      });
  };

  useEffect(() => {
    fetchPasswords(); 
  }, []);

  // Dodawanie hasła
  const addPassword = () => {
    if (!password || !title) {
      Swal.fire({
        width: '350px',
        icon: 'warning',
        title: 'Uwaga!',
        text: 'Uzupełnij oba pola: nazwę i hasło!',
        confirmButtonText: 'OK',
        confirmButtonColor: '#28a745',
        timer: 3000,
      });
      return;
    }

    Axios.post('http://localhost:3001/addpassword', { password, title })
      .then((response) => {
        Swal.fire({
          icon: 'success',
          title: 'Sukces!',
          text: 'Hasło zostało dodane.',
          confirmButtonColor: '#28a745',
        });

        fetchPasswords();

        setPasswordList([...passwordList, {
          id: response.data.id, 
          password,
          title,
          iv: response.data.iv,
          isDecrypted: false,
          originalTitle: title,
        }]);

        setPassword('');
        setTitle('');
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Błąd!',
          text: 'Nie udało się dodać hasła.',
          confirmButtonColor: '#28a745',
        });
        console.error(error);
      });
  };

  // Generowanie losowego hasła
  const generatePassword = () => {
    Axios.get('http://localhost:3001/generatepassword', { params: { length: 16 } })
      .then((response) => {
        setPassword(response.data.password);
        Swal.fire({
          icon: 'info',
          title: 'Wygenerowano hasło!',
          text: `Twoje nowe hasło: ${response.data.password}`,
          confirmButtonColor: '#28a745',
        });
      })
      .catch((error) => console.error(error));
  };

  // Przełączanie między odszyfrowanym hasłem a nazwą
  const toggleEncryption = (entry) => {
    if (entry.isDecrypted) {
      setPasswordList(passwordList.map((val) =>
        val.id === entry.id ? { ...val, title: val.originalTitle, isDecrypted: false } : val
      ));
    } else {
      Axios.post('http://localhost:3001/decryptpassword', {
        password: entry.password,
        iv: entry.iv,
      })
        .then((response) => {
          setPasswordList(passwordList.map((val) =>
            val.id === entry.id ? { ...val, title: response.data, isDecrypted: true } : val
          ));
        })
        .catch((error) => {
          Swal.fire({
            icon: 'error',
            title: 'Błąd!',
            text: 'Nie udało się odszyfrować hasła.',
            confirmButtonColor: '#28a745',
          });
          console.error(error);
        });
    }
  };

  // Usuwanie hasła
  const deletePassword = (id) => {
    Swal.fire({
      title: 'Czy na pewno chcesz usunąć to hasło?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Usuń',
      confirmButtonColor: '#d33',
      cancelButtonText: 'Anuluj',
    }).then((result) => {
      if (result.isConfirmed) {
        Axios.delete(`http://localhost:3001/deletepassword/${id}`)
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Usunięto!',
              text: 'Hasło zostało usunięte.',
              confirmButtonColor: '#28a745',
            });

            setPasswordList(passwordList.filter((val) => val.id !== id));
          })
          .catch((error) => {
            Swal.fire({
              icon: 'error',
              title: 'Błąd!',
              text: 'Nie udało się usunąć hasła.',
              confirmButtonColor: '#28a745',
            });
            console.error(error);
          });
      }
    });
  };

  return (
    <div className="App">
      <div className="AddPassword">
        <text>Nazwa strony</text>
        <input
          type="text"
          placeholder="Youtube"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <text>Hasło</text>
        <div className="PasswordInputContainer">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="hasło123"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button
          type="button"
          className="TogglePasswordButton"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "Ukryj" : "Pokaż"}
        </button>
      </div>
        <div className="ButtonBox">
        <button onClick={addPassword} className="AddButton">Dodaj hasło</button>
        <button onClick={generatePassword} className="GenerateButton">Wygeneruj hasło</button>
        </div>
      </div>
      <div className="Passwords">
        {passwordList.map((val) => (
          <div key={val.id} className="Password" onClick={() => toggleEncryption(val)}>
            <h3 >{val.title}</h3>
            <button onClick={() => deletePassword(val.id)} className="DeleteButton">
              Usuń
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;