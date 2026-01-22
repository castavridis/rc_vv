import { getUser } from './lib/auth/session';
import LoginButton from './components/LoginButton';
import UploadForm from './components/UploadForm';
import RadarChart from './components/RadarChart';

const sampleRadarData = {
  "Sincerity": 5,
  "Excitement": 3,
  "Competence": 7,
  "Sophistication": 4,
  "Ruggedness": 2
};

export default async function Page() {
  const user = await getUser()

  return (
    <div className="container py-12 mx-auto">
      <h1 className="text-3xl font-bold font-mono mb-4">vv.</h1>
      <p>fka Visible Vibes</p>
      <p>vv </p>
      {
        !user
          ? <div>
              <p>vv is in development and is currently only open to Recursers.</p>
              <LoginButton />
            </div>
          : <div>
              Hi {user.name}!
              <UploadForm />
              <RadarChart
                data={sampleRadarData}
                width={400}
                height={400}
                fillColor="#22c55e"
                className="mx-auto mt-8"
              />
            </div>
      }
    </div>
  )
}
