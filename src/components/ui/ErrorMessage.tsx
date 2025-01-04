interface ErrorMessageProps {
    message?: string
  }
  
  export function ErrorMessage({ message }: ErrorMessageProps) {
    if (!message) return null
    
    return (
      <div className="bg-red-50 p-4 rounded text-red-600 text-sm">
        {message}
      </div>
    )
  }