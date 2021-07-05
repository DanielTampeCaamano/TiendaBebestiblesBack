const stringMessages = (parameterName, finalLetter = 'o') => {
    return {
        'any.required': `${parameterName} es requerid${finalLetter}`,
        'string.empty': `${parameterName} no puede estar vací${finalLetter}`,
        'string.required': `${parameterName} es requerid${finalLetter} `,
        'string.min': `${parameterName} debe ser de un mínimo de {#limit} caracteres de largo`,
        'string.max': `${parameterName} debe ser de un máximo {#limit} caracteres de largo `,
        'string.email': `Ingrese un correo electrónico válido `,
        'number.min': `${parameterName} debe ser mayor o igual a {#limit}`,
        'number.max': `${parameterName} debe ser menor o igual a {#limit} `,
    }
}

module.exports = stringMessages;