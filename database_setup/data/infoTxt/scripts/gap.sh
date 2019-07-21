#/bin/bash

nelect=`awk '/NELECT/ {print $3/1}' $1`
if [ $((nelect%2)) -eq 0 ]; then
 homo=`awk '/NELECT/ {print $3/2}' $1`
 lumo=`awk '/NELECT/ {print $3/2+1}' $1`
else
 nelect=$(( $nelect-1 ));
 homo=$(( $nelect/2 ));
 lumo=$(( $nelect/2+1 ));
fi
nkpt=1

#echo $homo $lumo

e1=`grep "     $homo     " $1 | head -$nkpt | sort -n -k 2 | tail -1 | awk '{print $2}'`
e2=`grep "     $lumo     " $1 | head -$nkpt | sort -n -k 2 | head -1 | awk '{print $2}'`

echo $( echo "$e2 - $e1" | bc -l );
#echo "HOMO: band:" $homo " E=" $e1
#echo "LUMO: band:" $lumo " E=" $e2
