import UserNav from './_components/UserNav'
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
        <UserNav />
        { children }
      </body>
		</html>
	)
}
