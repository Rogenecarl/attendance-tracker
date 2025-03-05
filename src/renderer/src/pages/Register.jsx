import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const Register = () => {
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await window.api.createUser({ username, password })
      // Navigate to login with success state
      navigate('/login', { 
        state: { registrationSuccess: true }
      })
    } catch (error) {
      toast.error(error.message)
    }
  }

  // ... rest of register component code
} 