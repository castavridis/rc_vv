'use client'

import { useForm, SubmitHandler } from 'react-hook-form'

type Inputs = {
  imgUrl: string
}
export default function UploadForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>()
  const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data)
  const imgSrc = watch("imgUrl")
  return (
    <div>
      {
        imgSrc 
          ? <img src={imgSrc} />
          : 'Input a URL'
      }
      <form onSubmit={handleSubmit(onSubmit)}>
        <label>
          Past imgURL here.
          <input {...register("imgUrl")} />
        </label>
        <input type="submit" />
      </form>
    </div>
  )
}