# Style Savant Vendor Portal — Screen Specifications



---

## Page 1

 
 
Style  Savant 
Vendor  Portal  —  Screen  Specifications Full  UX  Spec  —  All  States,  Interactions  &  Edge  Cases   ·   For  use  with  Google  Stitch   ·   CODED  E-Matrix  Technology  Ltd   
·
  
v1.0
  
·
  
2026  
This  document  defines  every  screen  in  the  Style  Savant  Vendor  Portal.  Each  entry  covers  layout,  all  UI  
elements,
 
all
 
interactive
 
states,
 
edge
 
cases,
 
and
 
navigation
 
triggers.
 
Use
 
directly
 
as
 
input
 
for
 
Google
 
Stitch
 
UI
 
generation.  
SCREEN  INDEX 
V-01   Vendor  Sign-Up V-02   Subscription  Tier  Select V-03   Dashboard  Home V-04   Products  —  All  Listings V-05   Product  Upload  /  Edit V-06   Orders  —  All  Orders V-07   Order  Detail  +  Tracking V-08   Measurements  —  Tailor  Orders V-09   AI  Campaign  Creation V-10   Campaign  History V-11   Token  Wallet  &  Top-Up V-12   Payouts  &  Earnings V-13   Inventory  Management V-14   Virtual  Try-On  Tool  (Vendor  QA) V-15   Storefront  Settings V-16   Analytics  Overview V-17   Subscription  Management V-18   Notifications  &  Alerts V-19   Account  &  Settings V-20   Token  Paywall  Overlay V-21   Backdrop  Upload  




---

## Page 2

V-01 Vendor  Sign-Up 
 
Layout –  Full-screen  teal  background  (#2F9C95).  No  sidebar  —  this  is  pre-portal  onboarding. –  Top  centre:  Style  Savant  logo  mark  (64×96px)  +  wordmark  'Style  Savant'  below  in  white  22pt  bold. –  Subheading:  'Sell  on  Style  Savant'  in  white  16pt  bold.  Below:  'Set  up  your  vendor  account'  in  12pt. –  White  form  card  (rounded  12px,  margin  20px  each  side)  containing  all  fields. –  Fields  (top  to  bottom):  Business  Name  ·  Full  Name  ·  Email  Address  ·  Ghana  Phone  (+233)  ·  Business  
Category
 
(Fashion
 
/
 
Art
 
/
 
Both
 
—
 
dropdown)
 
·
 
Password
 
·
 
Confirm
 
Password. –  Each  field:  white  rounded  input,  teal  border  on  focus,  inline  red  error  on  blur  if  invalid. –  Terms  checkbox:  'By  signing  up  you  agree  to  the  Style  Savant  Vendor  Terms.'  —  required  before  submit. –  Primary  CTA:  'Create  Vendor  Account'  —  coral,  full-width,  48px  height,  rounded  12px. –  Below  CTA:  'Already  have  an  account?   Log  In'  —  teal  text  link.  State  /  Trigger Behaviour  /  UI  Response 
Default All  fields  empty.  CTA  disabled  (40%  opacity).  Terms  checkbox  unchecked. Typing CTA  enabled  only  when  all  required  fields  valid  AND  terms  checked. Email  already  registered Inline  error  below  email  field:  'An  account  with  this  email  exists.  Log  in  instead?'  with  teal  link. Phone  invalid Inline  error:  'Enter  a  valid  Ghana  number  starting  with  +233.' Password  mismatch Inline  error  on  confirm  field:  'Passwords  do  not  match.' Submitting CTA  shows  spinner,  all  fields  locked.  Teal  loading  overlay  on  card. Success Full-screen  teal  confirmation:  'Account  created!  Check  your  email  to  verify  your  address.'  →  navigates  to  V-02  after  email  verify. Admin  approval  pending After  email  verify:  'Your  account  is  under  review.  We  will  notify  you  within  24  hours.'  No  dashboard  access  until  approved.  Navigation:   Submit  →  email  verification  →  Admin  approval  →  V-02  Subscription  Select  →  V-03  Dashboard. Edge  Case:   Business  Name  already  taken:  inline  error  'That  business  name  is  in  use.  Try  another.' Edge  Case:   Network  error  on  submit:  toast  'Registration  failed.  Check  your  connection  and  try  again.'  Fields  
preserved. 
  
V-02 Subscription  Tier  Select 
 
Layout –  Off-white  background.  Dark  header  bar  (full-width,  60px):  'Choose  your  plan'  in  white  16pt  bold.  Subtext:  
'Billed
 
monthly
 
via
 
Paystack.
 
You
 
can
 
upgrade
 
at
 
any
 
time.' –  Three  tier  cards  stacked  vertically  (16px  margin  each  side,  12px  gap  between  cards). –  Starter  (Free):  white  card.  Growth  (GHS  120/mo):  white  card  with  'Most  Popular'  coral  badge  top-right.  
Pro
 
(GHS
 
280/mo):
 
white
 
card. –  Each  card  contains:  tier  name  (16pt  bold)  ·  price  (22pt  bold,  teal)  ·  horizontal  divider  ·  5  feature  
checkmarks
 
with
 
green
 
tick
 
icons
 
·
 
CTA
 
button. 



---

## Page 3

–  Feature  rows  per  tier:  listing  count  ·  monthly  token  allowance  ·  AI  feature  access  ·  Paystack  payout  ·  
vendor
 
storefront
 
page. –  Starter  CTA:  'Start  Free'  —  grey  button.  Growth/Pro  CTA:  'Choose  [Tier]'  —  coral  button. –  Bottom  note:  'Token  top-ups  available  on  all  plans  from  GHS  75  /  1,000  tokens.'  State  /  Trigger Behaviour  /  UI  Response 
Default All  three  cards  visible.  No  pre-selection. CTA  tap Paystack  subscription  checkout  opens  for  paid  tiers.  Free  tier  goes  directly  to  V-03. Payment  processing CTA  spinner.  Card  locked.  'Processing  your  subscription…'  overlay. Payment  success Toast:  'Plan  activated!'  →  navigate  to  V-03  Dashboard. Payment  failed Toast  error:  'Payment  unsuccessful.  Please  check  your  details.'  Step  reloads. Returning  vendor  (changing  plan) 
Current  plan  highlighted  with  teal  border.  CTAs  show  'Switch  to  [Tier]'  instead  of  'Choose'.  Navigation:   Plan  selected  +  payment  →  V-03  Dashboard  Home. Edge  Case:   Vendor  skips  this  screen  (e.g.  direct  link):  redirect  back  to  V-02  with  banner  'Choose  a  plan  to  
access
 
your
 
dashboard.' 
  
V-03 Dashboard  Home 
 
Layout –  Persistent  layout  used  across  all  portal  screens:  dark  top  bar  (full-width,  28px)  showing  'Style  Savant  
Vendor
 
Portal'
 
left-aligned
 
in
 
teal,
 
token
 
balance
 
pill
 
right-aligned
 
('120
 
tokens
 
·
 
GHS
 
75/1,000'). –  Left  sidebar  (100px  wide,  dark  background):  8  nav  items  —  Dashboard  ·  Products  ·  Orders  ·  
Measurements
 
·
 
Campaigns
 
·
 
Tokens
 
·
 
Payouts
 
·
 
Settings.
 
Active
 
item:
 
teal
 
highlight
 
strip
 
+
 
white
 
bold
 
label
 
+
 
coral
 
icon.
 
Inactive:
 
grey
 
label
 
+
 
grey
 
icon. –  Main  content  area  (right  of  sidebar):  off-white  background.  Page  header  bar  (white,  40px):  page  title  bold  
15pt
 
+
 
subtitle
 
11pt
 
grey. –  Token  alert  strip  (amber,  full  content  width,  28px):  fires  when  balance  <  200  tokens.  'Low  token  balance:  
X
 
tokens
 
remaining.
 
Top
 
up
 
→'
 
—
 
entire
 
strip
 
is
 
tappable
 
to
 
V-11. –  Stats  grid  (2×2):  Active  Listings  (teal)  ·  Pending  Orders  (coral)  ·  This  Month  Sales  (green)  ·  Token  
Balance
 
(amber
 
if
 
low,
 
teal
 
if
 
healthy).
 
Each
 
card:
 
value
 
in
 
16pt
 
bold
 
+
 
label
 
+
 
trend/subtext. –  Recent  Orders  mini-table:  columns  —  Order  #  ·  Customer  ·  Status  ·  GHS.  Last  5  orders.  Status  shown  
as
 
colour-coded
 
badges
 
(Pending
 
=
 
amber,
 
Shipped
 
=
 
teal,
 
Delivered
 
=
 
green,
 
Cancelled
 
=
 
red). –  Low  Stock  Alerts  section:  list  of  products  at  ≤3  units.  Sold  Out  items  show  red  background  row.  Each  
row
 
tappable
 
→
 
V-13
 
Inventory. –  Quick  Actions  row:  '+  New  Product'  (coral)  ·  'Campaign'  (teal)  ·  'Top  Up  Tokens'  (teal).  All  small  pill  
buttons.  State  /  Trigger Behaviour  /  UI  Response 
Token  alert  visible Balance  <  200  tokens.  Amber  strip  appears  below  page  header.  Tapping  →  V-11  Token  Wallet. Pending  orders  >  48h Those  order  rows  in  the  Recent  Orders  table  show  orange  left  border  highlight. Sold  Out  product Row  in  Low  Stock  Alerts  shows  red  background  +  'SOLD  OUT'  badge. 



---

## Page 4

New  order  received Stats  card  'Pending  Orders'  increments.  Notification  dot  appears  on  Orders  nav  item. No  orders  yet Recent  Orders  shows:  'No  orders  yet.  Share  your  storefront  to  start  selling.'  with  storefront  link. Token  balance  =  0 Token  Balance  stat  card  turns  red.  Alert  strip  turns  red.  All  AI  feature  CTAs  in  portal  show  disabled  state  with  'Top  Up  Required'  tooltip.  Navigation:   Order  row  tap  →  V-07  Order  Detail.  Low  stock  row  tap  →  V-13  Inventory.  Quick  action  'New  
Product'
 
→
 
V-05.
 
'Campaign'
 
→
 
V-09.
 
'Top
 
Up'
 
→
 
V-11. Edge  Case:   First-time  vendor  (no  products):  stats  show  zeros.  'Add  your  first  product'  prompt  card  replaces  
product/order
 
sections. Edge  Case:   Subscription  expired:  full-screen  modal  'Your  plan  has  expired.  Renew  to  continue.'  with  Paystack  
renewal
 
CTA.
 
Dashboard
 
locked
 
behind
 
modal.  



---

## Page 5

V-04 Products  —  All  Listings 
 
Layout –  Standard  portal  chrome  (top  bar  +  sidebar,  Products  nav  item  active). –  Page  header:  'Products'  +  subtitle  showing  counts:  'X  active  ·  X  drafts  ·  X  archived'. –  Toolbar  row:  search  input  (left,  fills  available  width  minus  button)  +  '+  Add  Product'  coral  button  (right,  
44px). –  Filter  chip  row  below  toolbar:  All  ·  Active  ·  Draft  ·  Sold  Out  ·  Archived.  Active  chip:  coral  fill,  white  text. –  Product  table:  columns  —  thumbnail  (32×36px)  ·  Product  Name  +  SKU  below  in  grey  ·  Stock  count  ·  
Price
 
(GHS)
 
·
 
Status
 
badge
 
·
 
Edit
 
button. –  Stock  count:  red  text  if  0,  amber  if  ≤3,  dark  if  healthy. –  Status  badges:  Active  (green)  ·  Draft  (grey)  ·  Sold  Out  (red)  ·  Archived  (mid-grey). –  Each  row:  52px  height,  thin  divider  below.  Tap  anywhere  on  row  →  V-05  Product  Edit. –  Pagination  or  infinite  scroll  for  >  20  products.  Load  spinner  at  bottom.  State  /  Trigger Behaviour  /  UI  Response 
Filter  chip  tap Table  reloads  filtered  to  that  status.  Chip  fills  coral.  URL  query  param  updates. Search  input 300ms  debounce.  Table  filters  live  by  product  name  or  SKU.  'X  results'  count  below  toolbar. Search  —  no  results Empty  state:  'No  products  match  your  search.'  +  'Clear  search'  link. '+  Add  Product'  tap Navigate  to  V-05  in  'new  product'  mode  (empty  form). Row  tap Navigate  to  V-05  in  'edit'  mode  (form  pre-filled  with  product  data). 'Edit'  button  tap Same  as  row  tap  —  navigate  to  V-05  edit  mode. Sold  Out  row Row  background  tints  red  at  5%  opacity.  Stock  shows  '0'  in  red  bold. Empty  —  no  products  yet Full  empty  state:  illustration  +  'You  have  no  products  yet.'  +  '+  Add  your  first  product'  coral  CTA.  Navigation:   Row  tap  or  Edit  button  →  V-05  Product  Edit.  '+  Add  Product'  →  V-05  New  Product.  Sold  Out  badge  
→
 
V-13
 
Inventory. Edge  Case:   Archived  products  not  visible  by  default.  'Archived'  filter  chip  must  be  selected  to  show  them. 
  
V-05 Product  Upload  /  Edit 
 
Layout –  Standard  portal  chrome.  Page  header:  'New  Product'  or  'Edit  Product:  [Name]'  depending  on  mode.  
Back
 
arrow
 
navigates
 
to
 
V-04. –  Image  upload  zone  (full  content  width,  80px  height):  dashed  teal  border,  '+   Upload  Images'  centred,  
subtext
 
'Up
 
to
 
8
 
images.
 
First
 
image
 
=
 
cover.
 
Drag
 
to
 
reorder.' –  After  upload:  thumbnail  row  below  zone  (48×48px  each,  rounded  6px).  First  thumbnail  has  'Cover'  coral  
badge.
 
Drag
 
handle
 
on
 
each
 
for
 
reorder.
 
X
 
on
 
each
 
to
 
remove. –  AI  Image  Polish  strip  (teal  tint,  28px):  'AI  Image  Polish:  Clean  your  product  photos  automatically.  Costs  
tokens.'
 
with
 
'Polish
 
All'
 
button
 
right-aligned. 



---

## Page 6

–  Form  fields  (all  required  unless  stated):  Product  Name  ·  Product  Description  (multiline,  88px  tall)  ·  Price  
(GHS)
 
·
 
Category
 
(dropdown:
 
Fashion
 
/
 
Art
 
/
 
Accessories
 
/
 
Home
 
Decor
 
/
 
Other)
 
·
 
Stock
 
Quantity. –  Sizes  section:  labelled  'Available  Sizes'.  Tap-to-select  pill  grid:  XS  ·  S  ·  M  ·  L  ·  XL  ·  XXL  ·  Custom.  
Multiple
 
selectable.
 
Selected
 
pills
 
fill
 
teal. –  Custom  size  field:  appears  when  'Custom'  selected.  Input:  'Describe  custom  sizing  (e.g.  Free  Size,  One  
Size,
 
Bespoke).' –  Bespoke/Tailor  toggle  (full  row):  label  'This  item  is  made-to-measure  (tailor  orders)'.  Toggle  right-aligned.  
When
 
ON:
 
teal
 
tint
 
row
 
background
 
+
 
'Buyers
 
will
 
be
 
prompted
 
to
 
submit
 
measurements
 
at
 
checkout.'
 
note
 
appears
 
below. –  Two  action  buttons  at  bottom:  'Save  as  Draft'  (grey,  left  half)  ·  'Publish  Live'  (coral,  right  half).  Both  full  
content
 
width
 
split
 
equally. –  In  edit  mode:  additional  'Archive  Product'  red  text  link  below  action  buttons  +  'Delete  Product'  red  text  
link
 
(requires
 
confirmation).  State  /  Trigger Behaviour  /  UI  Response 
No  images  uploaded 'Publish  Live'  disabled  with  tooltip  'Add  at  least  one  image  to  publish.' Image  uploading Progress  ring  on  thumbnail  placeholder.  Polish  and  publish  locked  until  upload  complete. AI  Image  Polish  tap Deducts  tokens.  Processing  spinner  on  each  image.  Polished  versions  replace  originals.  Count  shown:  'X  tokens  used.' Insufficient  tokens  for  Polish 
Paywall  overlay  V-20  appears.  Polish  not  applied. 
Bespoke  toggle  ON Row  highlights  teal.  Note  appears.  On  buyer  side:  Smart  Measurements  scan  is  prompted  on  this  listing. Size  'Custom'  selected Custom  description  field  slides  into  view  below  size  pills. Save  as  Draft Saves  without  publishing.  Redirect  to  V-04  with  toast  'Draft  saved.' Publish  Live Validates  all  required  fields.  If  valid:  publishes  +  redirect  to  V-04  with  toast  'Product  live  on  storefront!'  If  invalid:  fields  with  errors  highlighted  red,  scroll  to  first  error. Archive  Product  (edit  mode) 
Confirm  dialog:  'Archive  [Product  Name]?  It  will  be  hidden  from  the  storefront  but  not  deleted.'  Confirm  →  V-04,  status  shows  Archived. Delete  Product  (edit  mode) 
Confirm  dialog:  'Permanently  delete  [Product  Name]?  This  cannot  be  undone.'  Confirm  →  removed  from  V-04.  Navigation:   Save/Publish  →  V-04  Products.  Back  arrow  →  V-04. Edge  Case:   Price  field:  only  numbers  and  decimals  accepted.  Non-numeric  input  blocked.  Max  value:  GHS  
99,999. Edge  Case:   Product  with  pending/active  orders  cannot  be  deleted  —  delete  button  disabled  with  tooltip  'Orders  
exist
 
for
 
this
 
product.
 
Archive
 
instead.'  



---

## Page 7

V-06 Orders  —  All  Orders 
 
Layout –  Standard  portal  chrome.  Orders  nav  item  active.  Page  header:  'Orders'  +  subtitle  'X  pending  ·  X  shipped  
·
 
X
 
delivered'. –  Filter  chip  row:  All  ·  Pending  ·  Shipped  ·  Delivered  ·  Cancelled. –  Orders  table:  columns  —  Order  #  (teal,  tappable)  ·  Date  ·  Customer  Name  ·  Order  Total  (GHS)  ·  Status  
badge
 
·
 
Quick
 
action. –  Status  badges:  Pending  (amber)  ·  Confirmed  (teal)  ·  Shipped  (teal  dark)  ·  Delivered  (green)  ·  Cancelled  
(red). –  Pending  rows  older  than  48  hours:  orange  left  border  on  the  row  to  flag  action  required. –  Quick  action  column:  'View'  button  for  all  rows.  'Mark  Shipped'  button  for  Confirmed  rows. –  Sort  controls:  'Newest  First'  (default)  toggle.  Click  column  header  to  sort  by  that  column. –  Pagination:  20  orders  per  page.  Page  controls  at  bottom.  State  /  Trigger Behaviour  /  UI  Response 
Filter  chip  tap Table  reloads  for  that  status.  Count  in  page  header  updates. Order  row  /  View  tap Navigate  to  V-07  Order  Detail. Mark  Shipped  tap Opens  inline  tracking  number  input  field  in  the  row.  Save  button  confirms.  Row  status  updates  to  Shipped.  Buyer  notified. Pending  >  48h Row  shows  orange  left  border  +  'Overdue'  small  label  under  status  badge. Cancelled  order  row Row  is  greyed  out  (50%  opacity).  View  only  —  no  actions  available. Empty  state No  orders  yet:  'No  orders  received  yet.  Share  your  storefront  to  start  selling.'  with  link. Search  by  order  #  or  customer 
Search  input  in  toolbar  filters  table  live  with  300ms  debounce. 
 Navigation:   Row  or  View  tap  →  V-07  Order  Detail. Edge  Case:   Cancelled  orders:  vendor  cannot  re-open.  Read-only  view  only. 
  
V-07 Order  Detail  +  Tracking 
 
Layout –  Standard  portal  chrome.  Back  arrow  →  V-06.  Page  header:  'Order  #SS-XXXX'  +  current  status  badge. –  Order  Status  Timeline  (horizontal):  5  stages  —  Placed  ·  Confirmed  ·  Packed  ·  Shipped  ·  Delivered.  
Completed
 
stages:
 
teal
 
dot
 
+
 
teal
 
connecting
 
line.
 
Upcoming:
 
grey
 
dot
 
+
 
grey
 
line.
 
Current
 
stage:
 
teal
 
dot
 
with
 
subtle
 
pulse
 
ring. –  Customer  section:  full  name  ·  phone  number  ·  full  delivery  address  ·  Ghana  Post  GPS  address  (if  
provided). –  Items  section:  for  each  item  —  product  thumbnail  (40×48px)  ·  product  name  bold  ·  size  ·  colour  ·  
quantity
 
·
 
line
 
total
 
(GHS)
 
right-aligned. 



---

## Page 8

–  Tailor/Measurements  section  (visible  only  if  listing  is  bespoke-flagged):  teal  tint  banner.  Shows  
buyer-submitted
 
measurements:
 
Chest
 
·
 
Waist
 
·
 
Hips
 
·
 
Height
 
·
 
Shoulder
 
·
 
Sleeve
 
(all
 
in
 
cm).
 
Plus
 
buyer
 
note
 
if
 
provided
 
(e.g.
 
'Shorten
 
hem
 
by
 
4cm').
 
'Print
 
/
 
Export
 
Measurements'
 
teal
 
button. –  Shipping  &  Tracking  section:  Ghana  Post  EMS  tracking  number  input  (13-char  format,  e.g.  
EA123456789GH).
 
Format
 
validation
 
on
 
entry.
 
Optional
 
courier
 
name
 
field.
 
'Save
 
Tracking
 
Number'
 
teal
 
CTA. –  Payment  Summary:  Item  total  ·  Style  Savant  fee  (8%  shown)  ·  Net  payout  to  vendor.  Teal  rule  above  net  
payout. –  Action  buttons:  'Mark  as  Confirmed'  (teal)  ·  'Mark  as  Shipped'  (coral)  ·  'Mark  as  Delivered'  (green)  —  
only
 
the
 
contextually
 
valid
 
next
 
action
 
is
 
enabled
 
at
 
any
 
time.  State  /  Trigger Behaviour  /  UI  Response 
Tracking  number  input Accepts  13  characters  only.  Real-time  format  check:  must  match  alphanumeric  pattern.  Red  border  if  invalid  format.  Green  checkmark  if  valid. Save  Tracking  Number Saves  to  order.  Buyer  receives  email/app  notification  with  tracking  number  and  Ghana  Post  EMS  link.  Button  shows  'Saved!'  for  1.5s. Mark  as  Confirmed Order  status  →  Confirmed.  Timeline  advances.  Buyer  notified.  Button  disabled  after  action. Mark  as  Shipped Order  status  →  Shipped.  Requires  tracking  number  to  have  been  saved  first.  If  no  tracking  number:  show  warning  'Add  a  tracking  number  before  marking  as  shipped.'  CTA  disabled. Mark  as  Delivered Order  status  →  Delivered.  Triggers  payout  processing  (Paystack).  Button  only  shown  on  Shipped  orders. Measurements  section Hidden  for  non-bespoke  orders.  Only  shown  when  listing  has  bespoke  toggle  ON. Print  /  Export  Measurements 
Opens  browser  print  dialog  pre-formatted  for  A4  measurements  sheet.  Also  offers  CSV  download. Cancelled  order All  action  buttons  hidden.  Read-only  view.  Cancellation  reason  shown  if  provided.  Navigation:   Back  →  V-06.  Tracking  saved  →  stays  on  V-07  (success  toast  shown).  Status  marked  →  stays  on  
V-07
 
with
 
updated
 
timeline. Edge  Case:   Tracking  number  format  validation:  must  be  exactly  13  characters,  alphanumeric.  Incorrect  format  
shows
 
inline
 
error
 
before
 
save
 
is
 
allowed. Edge  Case:   Order  with  multiple  items  from  same  vendor:  all  shown  in  items  section.  Partial  fulfilment  not  
supported
 
in
 
MVP
 
—
 
order
 
is
 
fulfilled
 
as
 
a
 
whole.  



---

## Page 9

V-08 Measurements  —  Tailor  Orders 
 
Layout –  Standard  portal  chrome.  Measurements  nav  item  active. –  Page  header:  'Measurements'  +  subtitle  'Smart  scan  data  from  buyer  orders'. –  Info  banner  (teal  tint,  full  width):  'Only  visible  for  orders  on  made-to-measure  or  bespoke-flagged  
listings.' –  Master  table:  columns  —  Order  #  ·  Customer  Name  ·  Chest  ·  Waist  ·  Hips  ·  Buyer  Note.  Rows  for  all  
bespoke
 
orders
 
across
 
all
 
time.
 
Sortable
 
by
 
date. –  Buyer  Note  column:  if  note  present,  text  shown  in  amber.  If  empty:  '—'  in  grey. –  Row  tap:  expands  inline  detail  panel  below  the  row  (accordion  style),  OR  opens  full  detail  view. –  Expanded  detail  panel  for  a  row:  body  measurement  summary  card  +  6  individual  measurements  (Chest  
·
 
Waist
 
·
 
Hips
 
·
 
Height
 
·
 
Shoulder
 
·
 
Sleeve
 
in
 
cm)
 
+
 
full
 
buyer
 
note. –  Body  diagram  placeholder  area  (60×100px):  greyed  outline  representing  MediaPipe  body  landmark  
scan.
 
In
 
production
 
this
 
would
 
show
 
the
 
actual
 
scan
 
overlay. –  Export  controls:  'Export  All  as  CSV'  teal  button  (top  right  of  page).  'Print  This  Order'  button  in  expanded  
detail. –  Filter:  filter  by  date  range  and  by  product/listing  name.  State  /  Trigger Behaviour  /  UI  Response 
Row  tap Accordion  expands  to  show  full  measurement  detail.  Other  open  rows  collapse. Export  All  as  CSV Downloads  a  .csv  file:  columns  =  Order  #,  Customer,  Date,  Chest,  Waist,  Hips,  Height,  Shoulder,  Sleeve,  Note. Print  This  Order Opens  browser  print  dialog  formatted  as  a  single-page  measurement  sheet  for  that  order. Buyer  Note  present Note  shown  in  amber  text  in  table  and  in  detail.  If  note  is  long:  truncated  in  table  with  'Show  more'  expand. No  bespoke  orders  yet Empty  state:  'No  tailor  orders  yet.  Mark  a  product  as  made-to-measure  in  V-05  to  start  collecting  measurements.' Measurement  data  missing  (buyer  skipped  scan) 
Row  shows  '—'  across  all  measurement  columns.  Note:  'Buyer  did  not  complete  measurement  scan.'  Action:  'Contact  buyer'  link  opens  mailto. 
 Navigation:   Order  #  link  in  table  →  V-07  Order  Detail  for  that  order.  Back  →  V-03  Dashboard. Edge  Case:   Measurements  are  sourced  from  MediaPipe  body  scan  completed  by  the  buyer.  Accuracy  depends  
on
 
buyer
 
completing
 
the
 
scan
 
correctly
 
—
 
noted
 
in
 
UI
 
with
 
'Estimated
 
measurements'
 
disclaimer. 
  
V-09 AI  Campaign  Creation 
 
Layout –  Standard  portal  chrome.  Campaigns  nav  item  active. –  Page  header:  'Campaign  Creator'  +  subtitle  'Powered  by  Google  Gemini  ·  Costs  tokens  per  generation'. –  Token  cost  notice  strip  (teal  tint,  24px):  'Each  generation  costs  tokens.  Current  balance:  X  tokens.'  —  
teal
 
text.
 
Right
 
side
 
shows
 
estimated
 
cost:
 
'est.
 
80
 
tokens
 
per
 
run.' 



---

## Page 10

–  Step  1  —  Select  Products:  label  +  subtext  'Pick  1–3  products  to  feature  in  this  campaign.'  Horizontal  
scroll
 
row
 
of
 
product
 
chips.
 
Each
 
chip:
 
small
 
thumbnail
 
(20×20px)
 
+
 
product
 
name
 
+
 
X
 
to
 
deselect.
 
'+
 
Add
 
product'
 
chip
 
at
 
end
 
opens
 
product
 
picker
 
popover. –  Step  2  —  Campaign  Prompt:  multiline  text  input  (72px  height).  Placeholder:  'e.g.  Celebrate  Eid  with  
vibrant
 
Ankara.
 
Target
 
young
 
women
 
in
 
Accra
 
and
 
the
 
diaspora.'
 
Character
 
counter
 
0/500. –  Step  3  —  Target  Market:  chip  selector  row  —  Domestic  (Ghana)  ·  Diaspora  ·  International.  Single  select.  
Default:
 
Domestic. –  Step  4  —  Format:  chip  selector  —  Instagram  Post  ·  Story  ·  Carousel.  Single  select.  Default:  Instagram  
Post. –  Generate  CTA:  'Generate  Campaign   (est.  80  tokens)'  coral  button,  full  content  width.  Disabled  if  no  
products
 
selected
 
or
 
prompt
 
empty. –  Generated  Output  section  (below  CTA):  shows  last  generated  result.  Campaign  image  preview  
(80×80px
 
thumbnail)
 
+
 
campaign
 
title
 
+
 
full
 
caption
 
text
 
+
 
hashtags
 
row.
 
Download
 
Image
 
(teal)
 
+
 
Copy
 
Caption
 
(teal)
 
+
 
Regenerate
 
(grey)
 
buttons.  State  /  Trigger Behaviour  /  UI  Response 
No  products  selected 'Generate  Campaign'  CTA  disabled.  Tooltip:  'Select  at  least  one  product  to  generate  a  campaign.' Prompt  empty CTA  disabled.  Tooltip:  'Write  a  prompt  to  guide  the  campaign  tone  and  target.' Generating CTA  replaced  with  spinner  +  'Generating  your  campaign…'.  All  inputs  locked.  Progress  message  cycles:  'Analysing  products…  ·  Writing  copy…  ·  Creating  image…' Insufficient  tokens CTA  tap  opens  V-20  Token  Paywall  overlay.  Generation  blocked. Success Output  section  updates  with  new  result.  Token  balance  decrements.  Toast:  'Campaign  generated  —  X  tokens  used.' Generation  failed  (API) Error  toast:  'Generation  failed.  Your  tokens  were  not  deducted.  Please  try  again.'  CTA  re-enabled. Download  Image  tap Campaign  image  downloaded  to  device  as  PNG.  Button  shows  'Downloaded!'  for  1.5s. Copy  Caption  tap Caption  text  copied  to  clipboard.  Button  shows  'Copied!'  for  1.5s. Regenerate  tap Re-runs  same  prompt/products/settings.  Deducts  another  ~80  tokens.  Confirm  dialog:  'Regenerate?  This  will  use  ~80  tokens.  Continue?'  Yes/Cancel.  Navigation:   Back  →  V-10  Campaign  History.  Token  balance  tap  →  V-11.  Generate  →  stays  on  V-09  with  output  
updated. Edge  Case:   Campaign  history  is  saved  automatically  after  every  successful  generation  —  visible  in  V-10  without  
any
 
manual
 
save
 
action
 
required. Edge  Case:   Carousel  format  generates  3  separate  images  (one  per  selected  product).  Download  gives  a  .zip  
with
 
all
 
3.  



---

## Page 11

V-10 Campaign  History 
 
Layout –  Standard  portal  chrome.  Campaigns  nav  item  active. –  Page  header:  'Campaign  History'  +  subtitle  'All  generated  campaigns  stored  here'.  '+  New  Campaign'  
coral
 
button
 
top-right. –  Campaign  cards  list  (vertical  scroll).  Each  card  (white,  rounded  10px,  80px  height,  10px  gap):  campaign  
image
 
thumbnail
 
(56×56px
 
left)
 
+
 
campaign
 
title
 
(13pt
 
bold)
 
+
 
metadata
 
line
 
(date
 
·
 
format
 
·
 
product
 
count
 
·
 
tokens
 
used)
 
+
 
two
 
action
 
buttons:
 
'View'
 
(teal
 
small)
 
and
 
'Reuse'
 
(grey
 
small). –  Empty  state:  'No  campaigns  yet.  Create  your  first  campaign.'  with  '+  New  Campaign'  CTA. –  Search  input  at  top:  filter  by  campaign  title.  Live  search  with  300ms  debounce.  State  /  Trigger Behaviour  /  UI  Response 
View  tap Expands  to  full  campaign  output  view:  full-size  image,  complete  caption,  hashtags,  format  info,  products  featured,  date,  tokens  used.  Download  and  Copy  buttons. Reuse  tap Navigates  to  V-09  Campaign  Creator  with  same  products,  prompt,  target  market,  and  format  pre-filled.  Token  cost  shown  fresh.  Vendor  can  edit  before  generating. New  Campaign  tap Navigate  to  V-09  with  empty  form. Empty  search  result No  campaigns  match  search:  'No  campaigns  match  your  search.'  +  'Clear  search'  link.  Navigation:   View  →  full  campaign  detail.  Reuse  →  V-09  pre-filled.  New  Campaign  →  V-09  blank. Edge  Case:   Campaigns  are  never  auto-deleted.  Storage  is  indefinite.  No  limit  on  campaign  history  in  MVP. 
  
V-11 Token  Wallet  &  Top-Up 
 
Layout –  Standard  portal  chrome.  Tokens  nav  item  active. –  Page  header:  'Token  Wallet'  +  subtitle  'GHS  75  per  1,000  tokens  ·  100%  retained  by  Style  Savant'. –  Balance  hero  card  (teal  fill,  full  content  width,  72px):  large  token  count  left-aligned  (32pt  bold  white)  +  
'tokens
 
remaining'
 
label
 
+
 
horizontal
 
usage
 
bar
 
(white
 
track,
 
coral
 
fill
 
for
 
used
 
portion,
 
percentage
 
label)
 
on
 
right
 
side. –  Low  balance  alert  (amber  tint  strip,  28px):  fires  when  <  200  tokens.  ' ⚠   Below  200  tokens.  Top  up  to  
keep
 
using
 
AI
 
features.' –  Token  Usage  Breakdown  section:  'This  Month  Usage'  heading.  Table  of  AI  features:  Campaign  Creation  
·
 
Virtual
 
Try-On
 
·
 
AI
 
Image
 
Polish
 
·
 
Smart
 
Measurements.
 
Each
 
row:
 
feature
 
name
 
·
 
call
 
count
 
·
 
tokens
 
used
 
·
 
mini
 
progress
 
bar
 
showing
 
share
 
of
 
total
 
spend. –  Token  Bundles  section:  'Top  Up  Tokens'  heading.  Three  bundle  cards  in  a  row:  1,000  tokens  /  GHS  75  ·  
5,000
 
tokens
 
/
 
GHS
 
350
 
(teal
 
card,
 
'Best'
 
pip)
 
·
 
10,000
 
tokens
 
/
 
GHS
 
650.
 
Price
 
in
 
bold
 
teal.
 
Bundle
 
name
 
small
 
above. –  'Pay  via  Paystack'  coral  CTA  (full  content  width,  36px)  below  bundles.  Selected  bundle  highlighted  with  
teal
 
border
 
before
 
payment. –  Fine  print:  'Tokens  credit  to  your  wallet  instantly  after  payment  confirmation.'  in  11pt  grey. –  Top-Up  History  section:  mini  table  —  Date  ·  Tokens  added  ·  GHS  paid.  Last  10  transactions. 



---

## Page 12

–  Legal  note:  'Token  system  is  structured  as  prepaid  software  service  credit.  CODED  holds  no  stored  
value
 
—
 
all
 
payments
 
processed
 
by
 
Paystack.'
 
11pt
 
grey
 
italic.  State  /  Trigger Behaviour  /  UI  Response 
Bundle  selection Tap  a  bundle  card  →  card  gets  teal  border  +  checkmark  badge.  Previously  selected  deselects. No  bundle  selected  +  CTA  tap 
CTA  disabled  until  a  bundle  is  selected.  Tooltip:  'Select  a  bundle  first.' 
Pay  via  Paystack  tap Paystack  checkout  opens  (new  window  or  in-app  sheet).  GHS  amount  shown  matches  selected  bundle. Payment  processing CTA  spinner.  Bundles  locked.  'Processing  payment…'  overlay  on  wallet  card. Payment  success Token  balance  increments  instantly.  Toast:  '+X,000  tokens  added  to  your  wallet!'  Balance  hero  card  updates.  Transaction  added  to  history. Payment  failed Toast:  'Payment  failed.  Tokens  not  added.  Please  try  again.'  CTA  resets. Balance  =  0  tokens Balance  hero  card  fills  red.  Alert  strip  turns  red.  All  AI  feature  CTAs  across  the  portal  disabled.  Navigation:   Paystack  checkout  →  returns  to  V-11  after  payment.  Token  alert  strip  anywhere  in  portal  →  V-11. Edge  Case:   Tokens  never  expire.  Unused  tokens  carry  over  indefinitely  —  no  monthly  reset  unless  subscription  
tier
 
changes. Edge  Case:   Act  987  compliance:  token  system  is  a  prepaid  software  credit,  not  a  stored-value  wallet.  No  
e-money
 
licence
 
required.  



---

## Page 13

V-12 Payouts  &  Earnings 
 
Layout –  Standard  portal  chrome.  Payouts  nav  item  active. –  Page  header:  'Payouts'  +  subtitle  'Powered  by  Paystack  Subaccounts'. –  Earnings  hero  card  (dark  fill,  full  content  width,  68px):  'Available  to  withdraw'  label  (grey  11pt)  +  GHS  
amount
 
(22pt
 
bold
 
teal)
 
+
 
'Next
 
automatic
 
payout:
 
[date]'
 
label
 
+
 
'Withdraw
 
Now'
 
coral
 
small
 
button
 
right-aligned. –  Three  earnings  stat  cards  in  a  row:  This  Month  ·  Last  Month  ·  Total  Earned.  Each  shows  GHS  amount  in  
teal
 
bold
 
11pt. –  Fee  transparency  strip  (teal  tint,  28px):  'Style  Savant  fee:  8%  per  transaction.  Deducted  at  source  via  
Paystack
 
—
 
no
 
manual
 
reconciliation
 
needed.' –  Payout  History  table:  columns  —  Date  ·  Orders  in  period  ·  Gross  (GHS)  ·  Fee  8%  (GHS)  ·  Net  Payout  
(GHS).
 
Net
 
column
 
teal
 
bold.
 
10
 
rows
 
per
 
page. –  Paystack  Subaccount  section:  'Connected  Account'  heading.  Card  showing  bank  name  ·  account  
number
 
(masked
 
****XXXX)
 
·
 
account
 
name
 
·
 
'Verified
 
✓
'
 
green
 
badge.
 
'Update
 
Bank
 
Details'
 
teal
 
small
 
button. –  Withdrawal  info  note:  'Payouts  are  processed  automatically  every  2  weeks.  Manual  withdrawal  available  
at
 
any
 
time
 
above
 
GHS
 
50
 
minimum.'  State  /  Trigger Behaviour  /  UI  Response 
Withdraw  Now  tap Confirms  withdrawal  to  connected  Paystack  subaccount.  Confirm  dialog:  'Withdraw  GHS  X  to  [Bank]  ****XXXX?'  Yes/Cancel.  On  confirm:  processing  spinner,  then  success  toast. Withdrawal  minimum  not  met 
'Withdraw  Now'  disabled.  Tooltip:  'Minimum  withdrawal  is  GHS  50.' 
No  bank  connected Hero  card  shows:  'Connect  your  bank  account  to  receive  payouts.'  CTA  →  Paystack  bank  setup  flow. Update  Bank  Details  tap Opens  Paystack  bank  account  update  flow  (external  or  in-app  sheet).  On  success:  account  card  updates. No  payouts  yet Payout  history  shows  empty  state:  'No  payouts  yet.  Complete  your  first  order  to  start  earning.' Payout  failed  (bank  issue) 
Failed  payout  row  shown  in  red  in  history.  'Retry'  button  on  that  row. 
 Navigation:   Update  Bank  Details  →  Paystack  flow  →  returns  to  V-12.  Order  #  in  payout  history  →  V-07  Order  
Detail. Edge  Case:   8%  fee  is  the  Style  Savant  marketplace  commission.  This  is  split  at  source  by  Paystack  subaccount  
—
 
vendor
 
always
 
sees
 
net
 
amount,
 
not
 
gross. Edge  Case:   Payout  schedule  and  minimum  withdrawal  threshold  to  be  confirmed  during  billing  configuration  
sprint
 
(per
 
Open
 
Questions
 
in
 
PRD). 
  
V-13 Inventory  Management 
 
Layout 



---

## Page 14

–  Standard  portal  chrome.  Products  nav  item  active  (inventory  is  a  sub-view  of  Products). –  Page  header:  'Inventory'  +  subtitle  'Stock  levels  across  all  active  listings'. –  Summary  stats  row  (4  cards):  Total  SKUs  ·  In  Stock  (green  count)  ·  Low  Stock  ≤3  (amber  count)  ·  Sold  
Out
 
(red
 
count). –  Toolbar:  search/filter  input  +  'Export  CSV'  teal  small  button. –  Filter  chips:  All  ·  Low  Stock  ·  Sold  Out  ·  By  Category. –  Inventory  table:  columns  —  Product  name  +  SKU  below  ·  Sizes  with  stock  per  size  (e.g.  S:2  M:4  L:0)  ·  
Overall
 
status
 
badge
 
·
 
Edit
 
button. –  Sizes  column:  each  size  variant  shown  as  'Size:Qty'.  Zero-stock  sizes  shown  in  red.  Truncated  if  >  3  
variants
 
with
 
'…'
 
expand. –  Status  badges:  In  Stock  (green)  ·  Low  Stock  (amber)  ·  Sold  Out  (red). –  AI  Inventory  Optimisation  strip  (teal  tint,  full  width,  36px):  'AI  Inventory  Optimisation  —  Run  demand  
forecast
 
and
 
get
 
restock
 
recommendations.
 
Costs
 
tokens.'
 
+
 
'Run
 
Analysis'
 
teal
 
button
 
right. –  AI  Forecast  Output  card  (white  card,  below  strip):  shows  last  run  date  +  tokens  used  +  actionable  
recommendations:
 
restock
 
alerts
 
(green
 
text)
 
+
 
overstock
 
warnings
 
(amber
 
text)
 
+
 
seasonal
 
forecasts
 
(teal
 
text). –  Bulk  stock  update:  checkbox  column  enables  multi-select.  'Update  Stock'  coral  button  appears  in  toolbar  
when
 
items
 
are
 
selected.  State  /  Trigger Behaviour  /  UI  Response 
Edit  button  tap Navigate  to  V-05  Product  Edit  for  that  product,  scrolled  to  the  stock/sizes  section. Run  Analysis  tap If  sufficient  tokens:  analysis  runs  (spinner,  5–10s).  Output  card  updates  with  new  forecast.  Tokens  deducted.  Toast:  'Analysis  complete  —  X  tokens  used.' Run  Analysis  —  insufficient  tokens 
Tap  opens  V-20  Token  Paywall  overlay. 
Sold  Out  product Row  background  tints  red  5%.  Status  badge  red.  Edit  button  highlighted  to  prompt  action. Export  CSV  tap Downloads  inventory-YYYY-MM-DD.csv  with  all  SKUs,  sizes,  stock  counts,  and  status. Bulk  update  selected Inline  stock  quantity  inputs  appear  in  each  selected  row.  'Save  All'  button  appears.  Mass  update  submitted  in  single  action. Search/filter Live  filter  by  product  name  or  SKU.  Category  filter  chips  reload  the  table.  Navigation:   Edit  →  V-05.  Back  →  V-03  Dashboard.  AI  analysis  output  links  to  order  history  data. Edge  Case:   AI  Inventory  Optimisation  reads  historical  order  data  from  the  platform.  New  vendors  with  <  10  
orders
 
see:
 
'Not
 
enough
 
order
 
history
 
for
 
forecasting
 
yet.
 
Check
 
back
 
after
 
your
 
first
 
10
 
orders.'  



---

## Page 15

V-14 Virtual  Try-On  Tool  (Vendor  QA) 
 
Layout –  Standard  portal  chrome.  Products  nav  item  active. –  Page  header:  'Try-On  Preview'  +  subtitle  'Test  how  products  look  before  publishing'. –  Info  banner  (teal  tint):  'Use  this  to  verify  your  product  renders  correctly  on  a  model  image  before  going  
live.
 
This
 
is
 
a
 
vendor
 
QA
 
tool
 
—
 
buyer-facing
 
try-on
 
is
 
on
 
the
 
public
 
listing
 
page.' –  Step  1  —  Select  Product:  dropdown  or  search  input  'Choose  a  product  from  your  catalogue…'.  Shows  
only
 
published
 
and
 
draft
 
products. –  Step  2  —  Select  Model  Image:  label  +  subtext.  Preset  model  row:  4  preset  thumbnails  (56×72px  each,  
rounded
 
6px).
 
Selected
 
preset
 
gets
 
coral
 
border
 
ring.
 
'+
 
Upload
 
custom'
 
option
 
at
 
end
 
of
 
row. –  Custom  upload:  dashed  upload  zone  appears  when  '+  Upload  custom'  selected.  Same  spec  as  V-05  
image
 
upload.
 
Max
 
1
 
image.
 
10MB
 
limit. –  Token  cost  notice:  'Each  try-on  render  costs  approximately  20  tokens.  Current  balance:  X  tokens.' –  'Generate  Try-On'  coral  CTA:  disabled  until  product  AND  model  both  selected. –  Result  area  (below  CTA):  full  content  width,  260px  height,  grey  background  placeholder.  Shows  
composite
 
render
 
after
 
generation.
 
'Save
 
to
 
Product
 
Gallery'
 
teal
 
button
 
+
 
'Discard'
 
grey
 
button.  State  /  Trigger Behaviour  /  UI  Response 
Product  not  selected CTA  disabled.  Tooltip:  'Select  a  product  first.' Model  not  selected CTA  disabled.  Tooltip:  'Select  or  upload  a  model  image.' Generating Result  area  shows  spinner  +  'Rendering  your  try-on…'  (est.  8–15  seconds).  CTA  disabled. Generation  success Render  appears  in  result  area.  Save  +  Discard  buttons  enabled. Generation  failed Error  message  in  result  area:  'Try-on  render  failed.  Tokens  not  deducted.  Check  your  product  image  quality  and  try  again.'  CTA  re-enabled. Save  to  Product  Gallery Render  saved  as  additional  product  image  in  V-05.  Toast:  'Try-on  image  added  to  product  gallery.'  Product  listing  now  shows  try-on  result. Discard  tap Render  cleared.  Result  area  resets  to  placeholder.  Tokens  still  deducted. Insufficient  tokens CTA  tap  opens  V-20  Token  Paywall  overlay.  Navigation:   Save  to  Gallery  →  navigates  to  V-05  Product  Edit  for  that  product  (gallery  tab  highlighted).  Discard  
→
 
stays
 
on
 
V-14. Edge  Case:   Custom  uploaded  model  image:  rights  and  consent  are  the  vendor's  responsibility.  CODED  does  
not
 
store
 
uploaded
 
model
 
images
 
beyond
 
the
 
session. 
  
V-15 Storefront  Settings 
 
Layout –  Standard  portal  chrome.  Settings  nav  item  active. –  Page  header:  'Storefront  Settings'  +  subtitle  'Customise  your  public  vendor  page'. –  Cover  Image:  full  content  width  upload  zone  (64px  height).  Recommended  dimensions  shown:  '1200  ×  
400px'.
 
Tap
 
to
 
replace.
 
Current
 
cover
 
shown
 
as
 
background
 
if
 
set. 



---

## Page 16

–  Logo:  56×56px  circle  upload  zone.  'Change  Logo'  small  teal  button  beside  it.  Recommended:  square  
image
 
400×400px
 
minimum. –  Business  Name  field:  pre-filled  with  registered  name.  Editable.  This  is  the  display  name  on  the  storefront  
—
 
can
 
differ
 
from
 
legal
 
name. –  Business  Bio  field:  multiline  textarea  (72px).  Max  300  characters.  Counter  shown  bottom-right. –  Category  Tags:  existing  tags  shown  as  teal  chips  with  X  to  remove.  '+  Add'  chip  opens  tag  input.  Max  8  
tags. –  Social  Links:  three  fields  —  Instagram  handle  ·  TikTok  handle  ·  Website  URL.  All  optional.  Validated  for  
correct
 
format
 
(no
 
@
 
prefix
 
needed
 
for
 
Instagram/TikTok). –  Shipping  &  Returns  Policy:  multiline  textarea  (60px).  Placeholder:  example  policy  text.  Max  1,000  
characters. –  'Save  Storefront  Settings'  coral  CTA  at  bottom.  Full  content  width.  State  /  Trigger Behaviour  /  UI  Response 
Cover  image  upload Drag-and-drop  or  click-to-upload.  JPG/PNG  only.  Max  5MB.  Cropping  tool  appears  after  upload  (1200×400px  ratio  enforced). Logo  upload Same  as  cover.  Square  ratio  enforced.  Circular  crop  preview  shown. Bio  character  limit  reached 
Counter  turns  red  at  300/300.  No  further  input  accepted. 
Tag  limit  reached  (8  tags) '+  Add'  chip  disappears.  Tooltip  on  hover:  'Maximum  8  tags  reached.  Remove  one  to  add  another.' Social  link  format  invalid Inline  error:  'Enter  just  your  username,  not  the  full  URL.'  for  Instagram/TikTok  fields. Save  tap Validates  all  fields.  On  success:  changes  go  live  on  storefront  immediately.  Toast:  'Storefront  updated!'  On  error:  inline  errors  shown. CODED  review  flag If  admin  flags  bio  as  non-compliant:  amber  banner  appears:  'Your  bio  has  been  flagged  for  review.  It  remains  live  but  a  CODED  admin  will  contact  you.'  Navigation:   Save  →  stays  on  V-15  (toast  shown).  View  public  storefront  link  in  page  header  →  opens  storefront  
page
 
in
 
new
 
tab. Edge  Case:   Changes  go  live  immediately  —  no  admin  approval  needed  for  storefront  content  edits  unless  bio  is  
flagged.  



---

## Page 17

V-16 Analytics  Overview 
 
Layout –  Standard  portal  chrome.  Dashboard  nav  item  active  (analytics  is  a  sub-view  of  dashboard). –  Page  header:  'Analytics'  +  subtitle  showing  active  date  range. –  Date  range  selector  chips:  7  days  ·  30  days  ·  90  days  ·  All  time.  Active  chip:  coral  fill. –  Revenue  chart:  full  content  width,  100px  height,  white  card.  Mini  bar  chart  showing  daily  revenue.  
X-axis:
 
date
 
labels
 
at
 
start
 
and
 
end.
 
Total
 
revenue
 
label
 
top-right
 
in
 
teal
 
bold. –  Key  Metrics  grid  (2-column):  Total  Orders  ·  Conversion  Rate  ·  Avg  Order  Value  ·  Try-On  Activations  +  
conversion
 
count
 
·
 
Top
 
Product
 
by
 
units
 
sold
 
·
 
Top
 
Traffic
 
Source. –  Each  metric  card  (white,  rounded  8px,  48px):  value  in  13pt  teal  bold  +  label  in  11pt  grey  +  trend  vs  
previous
 
period
 
in
 
green
 
(positive)
 
or
 
red
 
(negative). –  Token  ROI  card  (full  width,  white):  'X  tokens  spent  this  month  =  GHS  X  cost'  (grey)  +  'Revenue  from  
AI-assisted
 
sales:
 
GHS
 
X
 
(ROI
 
Xx)'
 
(green
 
bold).
 
Asterisk:
 
'AI-assisted
 
=
 
orders
 
where
 
buyer
 
used
 
Try-On
 
or
 
Smart
 
Measurements.' –  Campaign  Performance  (below  ROI):  table  of  last  5  campaigns  with:  title  ·  date  ·  format  ·  orders  
attributed
 
·
 
revenue
 
attributed.  State  /  Trigger Behaviour  /  UI  Response 
Date  range  chip  tap All  charts  and  metrics  reload  for  selected  period.  Loading  spinner  on  each  card. Insufficient  data  (new  vendor) 
Charts  show  empty  state  placeholders.  Note:  'Not  enough  data  yet.  Stats  update  as  orders  come  in.' Try-On  conversion Metric  shows  buyers  who  used  Try-On  and  then  purchased.  Denominator  =  all  Try-On  activations.  Numerator  =  those  who  completed  purchase. Token  ROI If  no  AI-assisted  orders:  'No  AI-assisted  sales  yet.  Use  Campaign  Creation  or  enable  Try-On  on  your  listings  to  track  ROI.' Campaign  row  tap Opens  V-10  Campaign  History  filtered  to  that  campaign.  Navigation:   Campaign  row  →  V-10.  Try-On  metric  →  V-14.  Token  ROI  note  →  V-11. Edge  Case:   Analytics  data  is  delayed  by  up  to  1  hour.  'Last  updated:  [time]'  shown  in  footer  of  analytics  section. 
  
V-17 Subscription  Management 
 
Layout –  Standard  portal  chrome.  Settings  nav  item  active. –  Page  header:  'Subscription'  +  subtitle  'Manage  your  Style  Savant  vendor  plan'. –  Current  Plan  hero  card  (dark  fill,  full  width,  80px):  plan  name  (16pt  bold  white)  +  price  +  renewal  date  +  
'ACTIVE'
 
green
 
badge
 
top-right
 
+
 
'Manage
 
via
 
Paystack'
 
coral
 
small
 
button. –  Plan  Includes  section:  list  of  5  features  with  green  check  icons  —  active  listing  count  +  used  count  ·  
monthly
 
token
 
allowance
 
+
 
used
 
count
 
·
 
AI
 
features
 
enabled
 
·
 
visibility
 
level
 
·
 
support
 
tier. –  Usage  This  Cycle  section:  two  usage  bars  —  Listings  (used  /  cap)  and  Tokens  (used  /  monthly  
allowance).
 
Bar
 
fills
 
teal
 
normally,
 
amber
 
if
 
>
 
80%
 
used. –  Change  Plan  section:  'Upgrade  to  Pro'  coral  CTA  (if  on  lower  tier)  +  'Downgrade  to  Starter'  grey  CTA.  
Note:
 
'Plan
 
changes
 
take
 
effect
 
on
 
next
 
billing
 
cycle.' 



---

## Page 18

–  Cancel  Subscription  section:  'Cancel  Subscription'  red  text  heading  +  explanatory  text  +  'Cancel'  button  
(grey
 
outline).
 
Not
 
a
 
CTA-style
 
button
 
to
 
avoid
 
accidental
 
taps.  State  /  Trigger Behaviour  /  UI  Response 
Usage  bar  >  80% Bar  turns  amber.  Subtext  under  bar:  'Approaching  your  limit.  Consider  upgrading.' Usage  bar  at  100%  (cap  hit) 
Bar  turns  red.  'Limit  reached.'  Subtext  +  upgrade  prompt.  New  listings  blocked  until  upgrade. Upgrade  CTA  tap Opens  V-02  Subscription  Tier  Select  showing  only  higher  tiers. Downgrade  CTA  tap Confirm  dialog:  'Downgrade  to  Starter?  Your  listing  count  will  reduce  to  10  on  next  billing  date.  Listings  above  the  cap  will  be  archived.'  Yes/Cancel. Cancel  tap Two-step:  first  tap  shows  'Are  you  sure?  You  will  lose  access  at  end  of  current  cycle.'  with  red  'Yes,  Cancel'  button  and  'Keep  My  Plan'  teal  button. Cancellation  confirmed Toast:  'Subscription  cancelled.  You  have  access  until  [date].'  Plan  card  shows  'Cancelling  on  [date]'  amber  badge. Manage  via  Paystack  tap Opens  Paystack  subscription  management  portal  in  new  tab.  Navigation:   Upgrade  →  V-02  Subscription  Select.  Cancel  confirmed  →  stays  on  V-17  with  updated  status. Edge  Case:   Downgraded  accounts:  listings  above  the  new  cap  are  archived  (not  deleted).  Vendor  notified  by  
email
 
7
 
days
 
before
 
billing
 
change
 
takes
 
effect.  



---

## Page 19

V-18 Notifications  &  Alerts 
 
Layout –  Standard  portal  chrome.  Notification  bell  icon  in  top  bar  shows  count  badge  when  unread  notifications  
exist.
 
Clicking
 
bell
 
opens
 
this
 
screen. –  Page  header:  'Notifications'  +  'X  unread'  count  in  teal. –  Filter  chip  row:  All  ·  Orders  ·  Stock  ·  Tokens  ·  Payouts  ·  System. –  Notification  list  (vertical  scroll).  Each  item  (50px,  divider  below):  category  icon  (28px  circle)  +  unread  dot  
(coral
 
8px,
 
top-right
 
of
 
icon
 
when
 
unread)
 
+
 
notification
 
text
 
(10pt,
 
bold
 
if
 
unread,
 
regular
 
if
 
read)
 
+
 
time/date
 
right-aligned. –  Notification  categories  with  distinct  icon  backgrounds:  Orders  (teal)  ·  Stock  (amber)  ·  Tokens  (amber)  ·  
Payouts
 
(green)
 
·
 
System
 
(grey). –  Unread  items:  teal  5%  background  tint  on  the  row. –  'Mark  All  as  Read'  teal  text  button  top-right  of  list. –  Notification  types:  New  order  received  ·  Order  >  48h  without  action  ·  Product  sold  out  ·  Low  stock  (≤3  
units)
 
·
 
Token
 
balance
 
low
 
·
 
Token
 
balance
 
=
 
0
 
·
 
Payout
 
processed
 
·
 
Payout
 
failed
 
·
 
Subscription
 
renewal
 
reminder
 
·
 
Subscription
 
expired
 
·
 
Storefront
 
approved
 
/
 
flagged.  State  /  Trigger Behaviour  /  UI  Response 
Notification  tap  —  Order Navigate  to  V-07  Order  Detail  for  that  order. Notification  tap  —  Stock Navigate  to  V-13  Inventory,  filtered  to  that  product. Notification  tap  —  Token Navigate  to  V-11  Token  Wallet. Notification  tap  —  Payout Navigate  to  V-12  Payouts. Notification  tap  —  System 
No  navigation.  Expand  to  show  full  message  text  if  truncated. 
Mark  All  as  Read  tap All  items  lose  unread  styling.  Unread  count  badge  clears. Filter  chip  tap List  filters  to  that  category.  Count  shows  'X  in  [category]'. Empty  —  no  notifications Illustration  +  'No  notifications  yet.  They  will  appear  here  as  activity  happens  on  your  store.'  Navigation:   Order  notif  →  V-07.  Stock  notif  →  V-13.  Token  notif  →  V-11.  Payout  notif  →  V-12. Edge  Case:   Notifications  are  also  sent  via  email  for:  new  orders,  payouts  processed,  subscription  renewal  (7  
days
 
before),
 
token
 
balance
 
=
 
0.
 
In-app
 
only
 
for:
 
low
 
stock,
 
token
 
low,
 
order
 
overdue. 
  
V-19 Account  &  Settings 
 
Layout –  Standard  portal  chrome.  Settings  nav  item  active. –  Page  header:  'Account  &  Settings'  +  business  name  as  subtitle. –  Profile  section:  avatar  (40×40px  circle,  teal)  +  business  name  (13pt  bold)  +  email  +  phone.  'Edit  Profile'  
teal
 
small
 
button. –  Payout  &  Banking:  connected  bank  details  (masked)  +  'Update  bank  details  →'  link  →  Paystack  flow. 



---

## Page 20

–  Notifications  section:  toggles  for  each  notification  type  —  New  orders  (Email  +  In-app)  ·  Low  stock  
(In-app
 
only)
 
·
 
Payout
 
processed
 
(Email)
 
·
 
Token
 
low
 
(In-app
 
only)
 
·
 
Subscription
 
renewal
 
(Email).
 
Each
 
row:
 
label
 
left
 
+
 
toggle
 
right. –  Security  section:  'Change  password  →'  link  ·  'Two-factor  authentication:  OFF'  toggle  ·  'Active  sessions  
→'
 
link. –  Subscription  section  (read-only  summary  with  'Manage  plan  →'  link  to  V-17). –  Danger  Zone  section  (separated  by  red-tinted  divider):  'Deactivate  storefront'  (hides  listings,  orders  still  
fulfilled)
 
+
 
explanatory
 
text
 
+
 
grey
 
outline
 
button.
 
'Delete
 
account
 
—
 
contact
 
CODED
 
support'
 
red
 
text
 
link
 
(no
 
self-serve
 
delete
 
in
 
MVP). –  'Log  Out'  grey  button  at  very  bottom.  State  /  Trigger Behaviour  /  UI  Response 
Edit  Profile  tap In-place  form  edit  on  profile  section.  Fields  become  editable.  'Save'  and  'Cancel'  buttons  appear.  Name  and  phone  editable;  email  requires  re-verification  to  change. Update  bank  details  tap Opens  Paystack  bank  update  flow.  On  return:  account  section  refreshes. Notification  toggle Toggles  persist  immediately  (API  call  on  change).  No  save  button  needed. 2FA  toggle  ON Opens  phone  number  verification  flow.  On  verify:  2FA  enabled.  Green  badge  'Enabled'  shown. Deactivate  storefront  tap Confirm:  'Deactivate  your  storefront?  All  your  listings  will  be  hidden  from  buyers.  Orders  already  placed  will  still  be  fulfilled.'  Yes/Cancel.  On  confirm:  storefront  hidden,  listings  archived. Log  Out  tap Confirm  dialog:  'Log  out  of  this  session?'  Yes/Cancel.  On  confirm:  session  cleared  →  V-01  Sign-Up  /  Log  In. Email  change  attempted After  save:  'A  verification  link  has  been  sent  to  your  new  email.  Your  email  will  update  once  verified.'  Old  email  remains  active  until  then.  Navigation:   Manage  plan  →  V-17.  Update  bank  details  →  Paystack  →  returns  to  V-19.  Log  out  →  V-01. Edge  Case:   Account  deletion  is  intentionally  not  self-serve  in  MVP.  Vendor  must  contact  CODED  support.  This  
protects
 
against
 
accidental
 
deletion
 
of
 
accounts
 
with
 
active
 
orders.  



---

## Page 21

V-20 Token  Paywall  Overlay 
 
Layout –  Full-screen  dim  overlay  (dark,  55%  opacity)  over  the  current  portal  screen.  Portal  content  visible  but  
non-interactive
 
behind
 
it. –  Centred  modal  card  (white,  rounded  8px,  360px  width,  ~380px  height). –  Modal  header  (dark  fill,  48px,  rounded  top):  'Top  Up  Required'  in  white  15pt  bold. –  Token  icon  (48×48px  circle,  amber  20%  tint,  centred):  coin/token  emoji  or  icon. –  'Not  enough  tokens'  heading  (14pt  bold,  dark,  centred). –  Action  details  (centred,  12pt  grey):  'This  action  requires  X  tokens.'  +  'You  have:  X  tokens  ·  You  need:  X  
tokens'
 
+
 
'After
 
this
 
action:
 
X
 
tokens
 
remaining'
 
(amber
 
if
 
positive,
 
red
 
if
 
zero). –  Horizontal  divider. –  Token  bundle  row  (two  compact  bundle  cards  side  by  side):  1,000  tokens  /  GHS  75  (white  card,  grey  
border)
 
·
 
5,000
 
tokens
 
/
 
GHS
 
350
 
(teal
 
card,
 
white
 
text,
 
'Best'
 
small
 
pip
 
above).
 
Both
 
tappable
 
to
 
select. –  'Buy  Tokens  via  Paystack'  coral  CTA  (full  modal  width,  36px). –  'Proceed  anyway  with  X  tokens'  teal  text  link  below  CTA  (only  shown  if  action  can  partially  function  or  if  
vendor
 
wants
 
to
 
proceed
 
despite
 
low
 
balance). –  Fine  print  (11pt  grey):  'Tokens  credit  instantly  after  Paystack  payment.  Partial  token  deductions  never  
occur
 
—
 
the
 
action
 
either
 
runs
 
completely
 
or
 
not
 
at
 
all.' –  X  close  button  top-right  of  modal  header  —  dismisses  overlay,  action  cancelled.  State  /  Trigger Behaviour  /  UI  Response 
Bundle  card  tap Card  highlights  with  teal  border  +  checkmark.  Previously  selected  deselects. Buy  Tokens  tap  (no  bundle  selected) 
Disabled.  Tooltip:  'Select  a  bundle  first.' 
Buy  Tokens  tap  (bundle  selected) 
Paystack  checkout  opens.  On  payment  success:  tokens  added,  overlay  closes  automatically,  original  AI  action  retriggers  with  new  balance. Proceed  anyway  tap Only  shown  when  action  cost  <=  current  balance  (safety  valve  for  edge  cases).  Closes  overlay,  action  runs,  tokens  deducted. X  close  tap Overlay  dismissed.  Original  action  cancelled.  Returns  to  current  screen. Payment  success  (via  overlay) 
Overlay  closes.  Toast:  '+X,000  tokens  added!'  Original  AI  action  starts  automatically. 
Payment  failed Toast  error  inside  overlay.  Overlay  stays  open.  Try  again. Token  balance  =  0  on  open 
'After  this  action'  line  shows  red  '0  tokens  remaining'.  'Proceed  anyway'  link  hidden. 
 Navigation:   Appears  on  top  of:  V-09  Campaign  Creator  ·  V-13  Inventory  (AI  analysis)  ·  V-14  Try-On  Tool  ·  V-05  
Product
 
Edit
 
(AI
 
Polish).
 
X
 
close
 
→
 
returns
 
to
 
triggering
 
screen. Edge  Case:   This  overlay  is  the  only  route  to  token  top-up  from  inside  a  feature  flow.  It  is  intentionally  shown  
in-context
 
rather
 
than
 
redirecting
 
to
 
V-11
 
to
 
minimise
 
drop-off. Edge  Case:   'Proceed  anyway'  link  is  only  shown  when  balance  is  positive  but  below  the  estimated  cost  of  the  
action.
 
When
 
balance
 
=
 
0,
 
proceed
 
option
 
is
 
hidden
 
entirely. 
  
V-21 Backdrop  Upload 



---

## Page 22

 
Layout –  Standard  portal  chrome.  Page  header:  'Backdrop  Upload'  +  back  arrow  navigates  to  V-03. –  Backdrop  image  upload  zone  (full  content  width,  120px):  dashed  teal  border,  'Drag  and  drop  backdrop  
image
 
or
 
click
 
to
 
upload',
 
subtext
 
'Recommended:
 
2000
 
x
 
2000px,
 
PNG
 
or
 
JPG'. –  Form  fields:  Backdrop  Title  ·  Description  (multiline)  ·  Keywords/Tags  (chip  input)  ·  Usage  Category  
(dropdown:
 
Portrait
 
/
 
Studio
 
/
 
Fantasy
 
/
 
Outdoor
 
/
 
Urban). –  Action  button:  'Save  &  Publish'  coral  CTA  at  bottom.  Full  content  width.  State  /  Trigger Behaviour  /  UI  Response 
Image  uploaded Thumbnail  preview  replaces  upload  zone  text.  'Change  Image'  small  link  appears. Publish  tap Validates  fields.  On  success:  toast  'Backdrop  published!'  →  redirects  to  V-04  Products  with  'Backdrops'  category  active.  Navigation:   Back  arrow  →  V-03  Dashboard.  Publish  →  V-04  Products  (filtered  to  Backdrops). 
  
Style  Savant  Vendor  Portal   ·   CODED  E-Matrix  Technology  Ltd   ·   Accra,  Ghana   ·   2026 
