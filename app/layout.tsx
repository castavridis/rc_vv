import './globals.css'

import dotenv from 'dotenv'
dotenv.config()

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body>
        { children }
      </body>
		</html>
	)
}
