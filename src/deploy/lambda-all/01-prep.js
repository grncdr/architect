let parallel = require('run-parallel-limit')
let prep = require('../lambda-one/prep')
let _progress = require('../../util/progress')

module.exports = function _prepare(params) {
  let {env, arc} = params
  return function _prep(results, finishedAll) {

    let total = results.length * 5 // 4 prep steps + 1 tick for bar instantiation
    let progress = _progress({
      name: `Preparing ${results.length} Function${results.length > 1? 's':''}:`,
      total
    })
    let tick = progress.tick

    let failedprep = []
    let tasks = results.map(pathToCode => finishedOne => {
      prep({
        env,
        arc,
        pathToCode,
        tick,
      },
      function _prepped(err) {
        if (err && err.message === 'cancel_not_found') {
          failedprep.push(pathToCode)
          tick('')
          tick('')
          tick('')
          tick('')
          tick('')
          finishedOne()
        }
        else if (err) {
          finishedOne(err)
        }
        else {
          finishedOne()
        }
      })
    })
    parallel(tasks, 4, function done(err) {
      if (err) {
        finishedAll(err)
      }
      else {
        let filtered = results.filter(pathToCode=> !failedprep.includes(pathToCode))
        finishedAll(null, filtered)
      }
    })
  }
}
