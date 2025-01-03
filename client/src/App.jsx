import './App.css';
import { useState, useEffect } from 'react';
import Axios from 'axios';
import Swal from 'sweetalert2';
import zxcvbn from 'zxcvbn';

function App() {
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [passwordList, setPasswordList] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null); // Nowy stan dla siły hasła
  const [passwordFeedback, setPasswordFeedback] = useState(''); // Feedback dotyczący hasła
  const [passwordCrackTime, setPasswordCrackTime] = useState(''); // Czas złamania hasła

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
          title: 'Error!',
          text: 'Failed to load passwords.',
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
        title: 'Warning!',
        text: 'Complete both fields: name and password!',
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
          title: 'Success!',
          text: 'The password has been added.',
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
        resetPasswordStrength(); // Resetujemy pasek siły hasła po dodaniu nowego hasła
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Very weak password!',
          text: 'The password is too weak!',
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
          title: 'Password generated!',
          text: `Your new password: ${response.data.password}`,
          confirmButtonColor: '#28a745',
        });
        evaluatePasswordStrength(response.data.password); // Ocena wygenerowanego hasła
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
            title: 'Error!',
            text: 'Password decryption failed.',
            confirmButtonColor: '#28a745',
          });
          console.error(error);
        });
    }
  };

  // Usuwanie hasła
  const deletePassword = (id) => {
    Swal.fire({
      title: 'Are you sure you want to delete this password?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#d33',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        Axios.delete(`http://localhost:3001/deletepassword/${id}`)
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'The password has been deleted.',
              confirmButtonColor: '#28a745',
            });

            setPasswordList(passwordList.filter((val) => val.id !== id));
          })
          .catch((error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Failed to remove password.',
              confirmButtonColor: '#28a745',
            });
            console.error(error);
          });
      }
    });
  };

  // Funkcja do sprawdzania siły hasła
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    evaluatePasswordStrength(newPassword);
  };

  // Funkcja oceniająca siłę hasła
  const evaluatePasswordStrength = (newPassword) => {
    const result = zxcvbn(newPassword);
    setPasswordStrength(result.score); // Ustawiamy ocenę siły hasła
    setPasswordFeedback(result.feedback.suggestions.join(', ')); // Ustawiamy feedback (sugestie)
    setPasswordCrackTime(result.crack_times_display.offline_slow_hashing_1e4_per_second); // Czas złamania hasła
  };

  // Resetowanie siły hasła po dodaniu nowego hasła
  const resetPasswordStrength = () => {
    setPasswordStrength(null);
    setPasswordFeedback('');
    setPasswordCrackTime('');
  };

  // Funkcja renderująca pasek siły hasła
  const renderPasswordStrength = () => {
    if (passwordStrength === null) return null;

    const strengthLabels = ["Very weak", "Weak", "Average", "Good", "Very good"];
    const strengthClassNames = ["weak", "fair", "good", "strong", "very-strong"];

    return (
      <div className="password-strength">
        <div className={`password-strength-bar ${strengthClassNames[passwordStrength]}`} />
        <span>{strengthLabels[passwordStrength]}</span>
        <div className="password-crack-time">
          <strong>Estimated breakage time: </strong>
          {passwordCrackTime ? passwordCrackTime : 'Brak danych'}
        </div>
        {passwordFeedback && (
          <div className="password-feedback">
            <strong>Suggestions:</strong> {passwordFeedback}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="App">
      <div className="AddPassword">
        <text>Page name</text>
        <input
          type="text"
          placeholder="Youtube"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <text>Password</text>
        <div className="PasswordInputContainer">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="password123"
            value={password}
            onChange={handlePasswordChange}
          />
          <button
            type="button"
            className="TogglePasswordButton"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div className='PasswordInfo'>
        {renderPasswordStrength()} 
        </div>
        <div className="ButtonBox">
          <button onClick={addPassword} className="AddButton">Add password</button>
          <button onClick={generatePassword} className="GenerateButton">Generate password</button>
        </div>
      </div>
      <div className="Passwords">
        {passwordList.map((val) => (
          <div key={val.id} className="Password" onClick={() => toggleEncryption(val)}>
            <h3 >{val.title}</h3>
            <button onClick={() => deletePassword(val.id)} className="DeleteButton">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
