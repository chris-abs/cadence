interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string
  }
  
  export function Input({ label, ...props }: InputProps) {
    return (
      <div>
        <label htmlFor={props.id} className="sr-only">
          {label}
        </label>
        <input
          {...props}
          className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
        />
      </div>
    )
  }