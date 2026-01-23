import { getUser } from './_lib/auth/session';
import LoginButton from './_components/LoginButton';
import UploadForm from './_components/UploadForm';
import RadarChart from './_components/RadarChart';
import BrandMaskVisualization from './_components/BrandMaskVisualization';

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
      <div className="absolute inset-0 z-10">
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
                <h2 className="text-xl font-semibold mt-12 mb-4">Brand Dimensions Visualization</h2>
              </div>
        }
      </div>

      {/* <BrandMaskVisualization
        autoPlay={true}
        animationDuration={8}
        className="mx-auto absolute inset-0 -z-10"
      /> */}
    </div>
  )
}
