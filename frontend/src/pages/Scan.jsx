import { useNavigate } from 'react-router-dom'
import PlateScan from '../components/PlateScan'
import PageHero from '../components/PageHero'
import { today } from '../utils/calc'

export default function Scan() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <PageHero
        eyebrow="Plate scan"
        title="Review meals from a photo."
        copy="Take a picture of your plate. AI identifies foods and portions first, then you review before saving."
        metric="AI"
        metricLabel="meal logging"
      />

      <PlateScan date={today()} onLogged={() => navigate('/')} />
    </div>
  )
}
