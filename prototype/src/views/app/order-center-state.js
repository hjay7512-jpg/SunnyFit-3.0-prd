import {orderType} from './order-center.cjs'
export default {
  data(){return {orderReceipt:null}},
  computed:{orderTab(){return orderType(this.$route.query.orderType)},orderDataMode(){return this.reviewMode?['empty','actual'].includes(this.$route.query.reviewOrders)?this.$route.query.reviewOrders:'examples':'actual'}},
  watch:{'$route.fullPath'(){this.orderReceipt=null}},
  methods:{setOrderTab(value){this.replaceReviewQuery({orderType:orderType(value),reviewOrders:this.$route.query.reviewOrders==='empty'?undefined:this.$route.query.reviewOrders})}}
}
