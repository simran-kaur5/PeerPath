import Joi from "joi";

const postSchema = Joi.object({
    content: Joi.string().trim().min(1).max(3000).required(),
    image: Joi.string().allow("").optional()
})

export default postSchema