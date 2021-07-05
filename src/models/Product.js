const { Schema, model } = require('mongoose');

const ProductSchema = new Schema({
	name: { type: String, required: true },
	description: { type: String, required: true },
	price: { type: Number, required: true },
	user: {
		type: Schema.ObjectId, ref: "User"
	}
}, {
	timestamps: true
})

module.exports = model('Product', ProductSchema);