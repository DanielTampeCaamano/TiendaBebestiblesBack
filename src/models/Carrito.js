const { Schema, model } = require('mongoose');

const CarritoSchema = new Schema({
	item: { type: String, required: true },
	description: { type: String, required: true },
	precio: { type: Number, required: true },
	user: {
		type: Schema.ObjectId, ref: "User"
	}
}, {
	timestamps: true
})

module.exports = model('Carrito', CarritoSchema);