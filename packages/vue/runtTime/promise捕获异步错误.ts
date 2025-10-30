const request = () => {
  return new Promise((resolve, reject) => {
    reject(123)
  })
}

try {
  new Promise((resolve, reject) => {
    console.log(1)
    reject(123)
    console.log(2)
  })
} catch (e) {
  console.log('e')
}
